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
import {
  UsersService,
  type CreateUserForSignupDto,
} from '../users/users.service';
import {
  ActivityAction,
  ActivityEntityType,
} from '../activity-logs/entities/activity-log.entity';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    isActive: boolean;
    lastActiveAt?: Date;
    roles: string[];
    permissions: string[];
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionService: RedisSessionService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly borrowersService: BorrowersService,
    private readonly usersService: UsersService,
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

  async signup(
    createUserDto: CreateUserForSignupDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const newUser = await this.usersService.createUserForSignup(
      createUserDto,
      ipAddress,
      userAgent,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: newUser.id },
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

    type Role = {
      role: {
        name: string;
        permissions: { permission: { name: string } }[];
      };
    };

    type Permission = { permission: { name: string } };

    const userRoles = (user.roles as Role[]).map((ur) => ur.role.name);
    const userPermissions = [
      ...(user.roles as Role[]).flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name),
      ),
      ...(user.permissions as Permission[]).map((up) => up.permission.name),
    ];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId || undefined,
      roles: userRoles,
      permissions: userPermissions,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: 900,
      algorithm: 'HS256',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, sessionId },
      {
        expiresIn: 604800,
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        algorithm: 'HS256',
      },
    );

    await this.usersService.markUserAsOnline(user.id, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: (user.phone as string | undefined) || undefined,
        isActive: user.isActive,
        lastActiveAt: (user.lastActiveAt as Date | undefined) || undefined,
        roles: userRoles,
        permissions: userPermissions,
      },
    };
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_SECRET) {
      throw new Error('JWT refresh secret is not configured');
    }

    const sessionId = await this.sessionService.createSession({
      userId: user.id,
      tenantId: user.tenantId || undefined,
      ipAddress,
      userAgent,
    });

    type Role = {
      role: {
        name: string;
        permissions: { permission: { name: string } }[];
      };
    };

    type Permission = { permission: { name: string } };

    const userRoles = (user.roles as Role[]).map((ur) => ur.role.name);
    const userPermissions = [
      ...(user.roles as Role[]).flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name),
      ),
      ...(user.permissions as Permission[]).map((up) => up.permission.name),
    ];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId || undefined,
      roles: userRoles,
      permissions: userPermissions,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: 900,
      algorithm: 'HS256',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, sessionId },
      {
        expiresIn: 604800,
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        algorithm: 'HS256',
      },
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

    if (userRoles.includes('BORROWER') && user.tenantId) {
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
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName as string,
        phone: (user.phone as string | undefined) || undefined,
        isActive: user.isActive,
        lastActiveAt: (user.lastActiveAt as Date | undefined) || undefined,
        roles: userRoles,
        permissions: userPermissions,
      },
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

      const userRoles = user.roles.map((ur) => ur.role.name);
      const userPermissions = [
        ...user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.name),
        ),
        ...user.permissions.map((up) => up.permission.name),
      ];

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId || undefined,
        roles: userRoles,
        permissions: userPermissions,
        sessionId: decoded.sessionId,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        algorithm: 'HS256',
      });

      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, sessionId: decoded.sessionId },
        {
          expiresIn: '7d',
          secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
          algorithm: 'HS256',
        },
      );

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
            kycDocument: true,
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
}
