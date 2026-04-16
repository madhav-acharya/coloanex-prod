import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service';
import { RedisSessionService } from './services/redis-session.service';
import { LoginDto } from './dto/login.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { BorrowersService } from '../borrowers/borrowers.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { registrationTemplate } from '../mail/templates';
import type { CreateUserForSignupDto } from '../common/interfaces/create-user-signup.interface';
import type {
  AuthTokens,
  JwtPayload,
} from '../common/interfaces/auth-tokens.interface';
import {
  extractRolesAndPermissions,
  createJwtPayload,
  createUserResponse,
} from '../common/helpers/auth.helper';
import { generateTokenPair } from '../common/helpers/token.helper';
import {
  ActivityAction,
  ActivityEntityType,
} from '../activity-logs/entities/activity-log.entity';

export type { AuthTokens };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionService: RedisSessionService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly borrowersService: BorrowersService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{
    id: string;
    email: string;
    password: string;
    isActive: boolean;
    isBanned: boolean;
    tenantId?: string;
    roles: any[];
    permissions: any[];
    [key: string]: any;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Account is banned');
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return {
      ...user,
      tenantId: user.tenantId || undefined,
    };
  }

  async signupWeb(
    createUserDto: CreateUserForSignupDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const newUser = await this.usersService.createUserForWebSignup(
      createUserDto,
      ipAddress,
      userAgent,
    );

    const result = await this.generateAuthResponse(
      newUser.id,
      ipAddress,
      userAgent,
    );

    const tenant = newUser.tenantId
      ? await this.prisma.tenant.findUnique({
          where: { id: newUser.tenantId },
        })
      : null;

    try {
      const tenantId = newUser.tenantId || 'default';
      const loginUrl = process.env.WEB_URL || 'https://web.example.com';

      await this.mailService.sendMail(
        {
          to: newUser.email,
          subject: `Welcome to ${tenant?.name || 'CoLoanEx'}`,
          html: registrationTemplate({
            tenantName: tenant?.name || 'CoLoanEx',
            tenantLogo: tenant?.logo || undefined,
            userName: newUser.fullName,
            userEmail: newUser.email,
            loginUrl,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
            tenantPrimaryColor: tenant?.primaryColor || undefined,
            tenantWebsite: tenant?.website || undefined,
          }),
        },
        tenantId,
      );
    } catch (error) {}

    return result;
  }

  async signupApp(
    createUserDto: CreateUserForSignupDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const newUser = await this.usersService.createUserForAppSignup(
      createUserDto,
      ipAddress,
      userAgent,
    );

    const result = await this.generateAuthResponse(
      newUser.id,
      ipAddress,
      userAgent,
    );

    const tenant = newUser.tenantId
      ? await this.prisma.tenant.findUnique({
          where: { id: newUser.tenantId },
        })
      : null;

    try {
      const tenantId = newUser.tenantId || 'default';
      const loginUrl = process.env.APP_URL || 'https://app.example.com';

      await this.mailService.sendMail(
        {
          to: newUser.email,
          subject: `Welcome to ${tenant?.name || 'CoLoanEx'}`,
          html: registrationTemplate({
            tenantName: tenant?.name || 'CoLoanEx',
            tenantLogo: tenant?.logo || undefined,
            userName: newUser.fullName,
            userEmail: newUser.email,
            loginUrl,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
            tenantPrimaryColor: tenant?.primaryColor || undefined,
            tenantWebsite: tenant?.website || undefined,
          }),
        },
        tenantId,
      );
    } catch (error) {}

    return result;
  }

  async loginWeb(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const { roles: userRoles } = extractRolesAndPermissions(user);

    const allowedRoles = ['Super Admin', 'Admin', 'Lender', 'Borrower'];
    const hasAllowedRole = userRoles.some((role) =>
      allowedRoles.includes(role),
    );

    if (!hasAllowedRole) {
      throw new ForbiddenException(
        'Access denied. Only Lender, Admin, and Super Admin can access web platform',
      );
    }

    return this.performLogin(user, ipAddress, userAgent);
  }

  async loginApp(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const { roles: userRoles } = extractRolesAndPermissions(user);

    const isBorrower = userRoles.some((role) => role === 'Borrower');

    if (!isBorrower) {
      throw new ForbiddenException(
        'Access denied. Only Borrowers can access mobile app',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { gasPaymentMode: 'PLATFORM_WALLET' as never },
    });

    return this.performLogin(user, ipAddress, userAgent);
  }

  private async generateAuthResponse(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User creation failed');
    }

    if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_SECRET) {
      throw new Error('JWT refresh secret is not configured');
    }

    const sessionId = await this.sessionService.createSession({
      userId: user.id,
      tenantId: user.tenantId || undefined,
      ipAddress,
      userAgent,
    });

    const { roles: userRoles, permissions: userPermissions } =
      extractRolesAndPermissions(user);

    const payload = createJwtPayload(
      user.id,
      user.email,
      userRoles,
      userPermissions,
      sessionId,
      user.tenantId || undefined,
    );

    const { accessToken, refreshToken } = generateTokenPair(
      this.jwtService,
      payload,
    );

    await this.usersService.markUserAsOnline(user.id, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: createUserResponse(user, userRoles, userPermissions),
    };
  }

  private async performLogin(
    user: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_SECRET) {
      throw new Error('JWT refresh secret is not configured');
    }

    const sessionId = await this.sessionService.createSession({
      userId: user.id,
      tenantId: user.tenantId || undefined,
      ipAddress,
      userAgent,
    });

    const { roles: userRoles, permissions: userPermissions } =
      extractRolesAndPermissions(user);

    const payload = createJwtPayload(
      user.id,
      user.email,
      userRoles,
      userPermissions,
      sessionId,
      user.tenantId || undefined,
    );

    const { accessToken, refreshToken } = generateTokenPair(
      this.jwtService,
      payload,
    );

    await this.activityLogsService.logUserActivity(
      user.id,
      ActivityAction.LOGIN,
      ActivityEntityType.USER,
      user.id,
      'User logged in successfully',
      null,
      null,
      ipAddress,
      userAgent,
      user.tenantId,
    );

    await this.usersService.markUserAsOnline(user.id, ipAddress, userAgent);

    const isBorrowerRole = userRoles.some((role) =>
      role.toLowerCase().includes('borrower'),
    );

    if (isBorrowerRole && user.tenantId) {
      await this.borrowersService.ensureBorrowerExists(
        user.id,
        user.tenantId,
        user.id,
        ipAddress,
        userAgent,
      );
    }

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: createUserResponse(user, userRoles, userPermissions),
    };
  }

  async refresh(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    try {
      void ipAddress;
      void userAgent;
      if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_SECRET) {
        throw new Error('JWT refresh secret is not configured');
      }
      const decoded = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });

      const sessionData = await this.sessionService.getSession(
        decoded.sessionId,
      );
      if (!sessionData || sessionData.userId !== decoded.sub) {
        throw new UnauthorizedException('Invalid session');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!user || user.isBanned) {
        await this.sessionService.revokeSession(decoded.sessionId);
        throw new UnauthorizedException('User not found or banned');
      }

      await this.sessionService.updateLastActivity(decoded.sessionId);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });

      const { roles: userRoles, permissions: userPermissions } =
        extractRolesAndPermissions(user);

      const payload = createJwtPayload(
        user.id,
        user.email,
        userRoles,
        userPermissions,
        decoded.sessionId,
        user.tenantId || undefined,
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        generateTokenPair(this.jwtService, payload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionId: decoded.sessionId,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(
    sessionId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.sessionService.revokeSession(sessionId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.activityLogsService.logUserActivity(
        userId,
        ActivityAction.LOGOUT,
        ActivityEntityType.USER,
        userId,
        'User logged out',
        null,
        null,
        ipAddress,
        userAgent,
        user.tenantId || undefined,
      );

      await this.usersService.markUserAsOffline(userId, ipAddress, userAgent);
    }
  }

  async logoutAll(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.sessionService.revokeAllUserSessions(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.activityLogsService.logUserActivity(
        userId,
        ActivityAction.LOGOUT,
        ActivityEntityType.USER,
        userId,
        'User logged out from all devices',
        null,
        null,
        ipAddress,
        userAgent,
        user.tenantId || undefined,
      );

      await this.usersService.markUserAsOffline(userId, ipAddress, userAgent);
    }
  }

  async validateAccessToken(token: string): Promise<JwtPayload> {
    try {
      const decoded: JwtPayload = this.jwtService.verify(token);

      const sessionData = await this.sessionService.getSession(
        decoded.sessionId,
      );
      if (!sessionData || sessionData.userId !== decoded.sub) {
        throw new UnauthorizedException('Invalid session');
      }

      await this.sessionService.updateLastActivity(decoded.sessionId);

      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
        tenant: true,
        borrowers: {
          include: {
            kycs: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: userPassword, ...userWithoutPassword } = user;
    void userPassword;
    return userWithoutPassword;
  }

  async getUserActiveSessions(userId: string) {
    return this.sessionService.getUserActiveSessions(userId);
  }

  async logUserVisit(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    tenantId?: string,
  ): Promise<void> {
    const lastActivity =
      await this.activityLogsService.getLastUserActivity(userId);
    if (!lastActivity || lastActivity.action === 'LEAVE') {
      await this.activityLogsService.logUserVisit(
        userId,
        ipAddress,
        userAgent,
        tenantId,
      );
    }
  }

  async logUserLeave(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    tenantId?: string,
  ): Promise<void> {
    const lastActivity =
      await this.activityLogsService.getLastUserActivity(userId);
    if (lastActivity && lastActivity.action === 'VISIT') {
      await this.activityLogsService.logUserLeave(
        userId,
        ipAddress,
        userAgent,
        tenantId,
      );
    }
  }
}
