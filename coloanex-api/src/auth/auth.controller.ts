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
import { GoogleLoginDto } from './dto/google-login.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { getClientIpAddress } from '../common/helpers/ip-address.helper';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('signup/web')
  @HttpCode(HttpStatus.CREATED)
  async signupWeb(
    @Body() createUserDto: CreateUserForSignupDto,
    @Req() req: Request,
  ) {
    const ipAddress = getClientIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.signupWeb(
      createUserDto,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
    };
  }

  @Public()
  @Post('signup/app')
  @HttpCode(HttpStatus.CREATED)
  async signupApp(
    @Body() createUserDto: CreateUserForSignupDto,
    @Req() req: Request,
  ) {
    const ipAddress = getClientIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.signupApp(
      createUserDto,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
    };
  }

  @Public()
  @Post('login/web')
  @HttpCode(HttpStatus.OK)
  async loginWeb(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = getClientIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.loginWeb(
      loginDto,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
    };
  }

  @Public()
  @Post('login/app')
  @HttpCode(HttpStatus.OK)
  async loginApp(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = getClientIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.loginApp(
      loginDto,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Req() req: Request,
  ): Promise<AuthTokens> {
    const ipAddress = getClientIpAddress(req);
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
    const ipAddress = getClientIpAddress(req);
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
    const ipAddress = getClientIpAddress(req);
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

  @UseGuards(JwtAuthGuard)
  @Post('visit')
  @HttpCode(HttpStatus.OK)
  async logVisit(
    @CurrentUser() user: { sub: string; tenantId?: string },
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ipAddress = getClientIpAddress(req);
    const userAgent = req.headers['user-agent'];

    await this.authService.logUserVisit(
      user.sub,
      ipAddress,
      userAgent,
      user.tenantId,
    );

    return { message: 'Visit logged successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('leave')
  @HttpCode(HttpStatus.OK)
  async logLeave(
    @CurrentUser() user: { sub: string; tenantId?: string },
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ipAddress = getClientIpAddress(req);
    const userAgent = req.headers['user-agent'];

    await this.authService.logUserLeave(
      user.sub,
      ipAddress,
      userAgent,
      user.tenantId,
    );

    return { message: 'Leave logged successfully' };
  }
}
