import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { UsersService } from '../users/users.service';
import type { CreateUserForSignupDto } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() createUserDto: CreateUserForSignupDto,
    @Req() req: Request,
  ) {
    const ipAddress =
      req.ip ||
      req.connection?.remoteAddress ||
      (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.signup(
      createUserDto,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
      user: result.user,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress =
      req.ip ||
      req.connection?.remoteAddress ||
      (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(loginDto, ipAddress, userAgent);

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Req() req: Request,
  ): Promise<AuthTokens> {
    const ipAddress =
      req.ip ||
      req.connection?.remoteAddress ||
      (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    return this.authService.refresh(refreshToken, ipAddress, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: { sessionId: string; sub: string },
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ipAddress =
      req.ip ||
      req.connection?.remoteAddress ||
      (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    await this.authService.logout(
      user.sessionId,
      user.sub,
      ipAddress,
      userAgent,
    );

    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: { sub: string },
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ipAddress =
      req.ip ||
      req.connection?.remoteAddress ||
      (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    await this.authService.logoutAll(user.sub, ipAddress, userAgent);

    return { message: 'Logged out from all devices successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user: { sub: string }) {
    return this.authService.getCurrentUser(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getUserSessions(@CurrentUser() user: { sub: string }) {
    return this.authService.getUserActiveSessions(user.sub);
  }
}
