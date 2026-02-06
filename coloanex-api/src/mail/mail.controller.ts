import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';

@Controller('mail')
@UseGuards(JwtAuthGuard)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('connect')
  async connect(@CurrentUser() currentUser: JwtPayload, @Res() res: Response) {
    if (!currentUser.tenantId) {
      return res
        .status(400)
        .json({ message: 'No tenant associated with user' });
    }

    const authUrl = this.mailService.getAuthUrl(currentUser.tenantId);
    return res.json({ authUrl });
  }

  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') tenantId: string,
    @Res() res: Response,
  ) {
    if (!code || !tenantId) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?mail=error`,
      );
    }

    try {
      await this.mailService.handleCallback(code, tenantId);
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?mail=success`,
      );
    } catch (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?mail=error`,
      );
    }
  }

  @Delete('disconnect')
  async disconnect(@CurrentUser() currentUser: JwtPayload) {
    return this.mailService.disconnect(currentUser);
  }

  @Get('status')
  async getStatus(@CurrentUser() currentUser: JwtPayload) {
    return this.mailService.getStatus(currentUser);
  }
}
