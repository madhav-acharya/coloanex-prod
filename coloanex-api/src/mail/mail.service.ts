import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { SendMailDto } from './dto/send-mail.dto';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { google } from 'googleapis';

@Injectable()
export class MailService {
  private transporters: Map<string, Transporter> = new Map();
  private oauth2Client: any;
  private envTransporter: Transporter | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_MAIL_CLIENT_ID,
      process.env.GOOGLE_MAIL_CLIENT_SECRET,
      process.env.GOOGLE_MAIL_CALLBACK_URL,
    );
    this.initializeEnvTransporter();
  }

  private initializeEnvTransporter(): void {
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    ) {
      this.envTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  getAuthUrl(tenantId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: tenantId,
      prompt: 'consent',
    });

    return authUrl;
  }

  async handleCallback(code: string, tenantId: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      this.oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          mailEmail: userInfo.data.email,
          mailAccessToken: tokens.access_token,
          mailRefreshToken: tokens.refresh_token,
          mailTokenExpiry: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
        },
      });

      this.transporters.delete(tenantId);

      return {
        message: 'Mail service connected successfully',
        isConnected: true,
        email: userInfo.data.email,
      };
    } catch (error) {
      console.error('Mail connection error:', error);
      throw new BadRequestException(
        error?.message || 'Failed to connect mail service',
      );
    }
  }

  async disconnect(currentUser: JwtPayload) {
    if (!currentUser.tenantId) {
      throw new BadRequestException('No tenant associated with user');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
    });

    if (!tenant || !tenant.mailEmail) {
      throw new BadRequestException('No mail configuration found');
    }

    await this.prisma.tenant.update({
      where: { id: currentUser.tenantId },
      data: {
        mailEmail: null,
        mailAccessToken: null,
        mailRefreshToken: null,
        mailTokenExpiry: null,
      },
    });

    this.transporters.delete(currentUser.tenantId);

    return {
      message: 'Mail service disconnected successfully',
      isConnected: false,
    };
  }

  async getStatus(currentUser: JwtPayload) {
    if (!currentUser.tenantId) {
      if (this.envTransporter) {
        return {
          isConnected: true,
          email: process.env.SMTP_FROM || process.env.SMTP_USER,
        };
      }
      return { isConnected: false };
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
      select: {
        mailEmail: true,
        mailAccessToken: true,
      },
    });

    if (!tenant || !tenant.mailEmail || !tenant.mailAccessToken) {
      if (this.envTransporter) {
        return {
          isConnected: true,
          email: process.env.SMTP_FROM || process.env.SMTP_USER,
        };
      }
      return { isConnected: false };
    }

    return {
      isConnected: true,
      email: tenant.mailEmail,
    };
  }

  async sendMail(sendMailDto: SendMailDto, tenantId: string): Promise<void> {
    // uncomment this to enable mail sending functionality.
    console.log('sendMail called with:', { sendMailDto, tenantId });
    // if (tenantId === 'default' && this.envTransporter) {
    //   try {
    //     await this.envTransporter.sendMail({
    //       from: process.env.SMTP_FROM || process.env.SMTP_USER,
    //       to: sendMailDto.to,
    //       subject: sendMailDto.subject,
    //       html: sendMailDto.html,
    //       text: sendMailDto.text,
    //     });
    //     return;
    //   } catch (error) {
    //     throw new InternalServerErrorException('Failed to send email');
    //   }
    // }
    // const tenant = await this.prisma.tenant.findUnique({
    //   where: { id: tenantId },
    // });
    // if (!tenant || !tenant.mailAccessToken || !tenant.mailRefreshToken) {
    //   if (this.envTransporter) {
    //     try {
    //       await this.envTransporter.sendMail({
    //         from: process.env.SMTP_FROM || process.env.SMTP_USER,
    //         to: sendMailDto.to,
    //         subject: sendMailDto.subject,
    //         html: sendMailDto.html,
    //         text: sendMailDto.text,
    //       });
    //       return;
    //     } catch (error) {
    //       throw new InternalServerErrorException('Failed to send email');
    //     }
    //   }
    //   throw new BadRequestException(
    //     'Mail service not configured for this tenant',
    //   );
    // }
    // try {
    //   this.oauth2Client.setCredentials({
    //     access_token: tenant.mailAccessToken,
    //     refresh_token: tenant.mailRefreshToken,
    //   });
    //   if (tenant.mailTokenExpiry && new Date() >= tenant.mailTokenExpiry) {
    //     const { credentials } = await this.oauth2Client.refreshAccessToken();
    //     await this.prisma.tenant.update({
    //       where: { id: tenantId },
    //       data: {
    //         mailAccessToken: credentials.access_token,
    //         mailTokenExpiry: credentials.expiry_date
    //           ? new Date(credentials.expiry_date)
    //           : null,
    //       },
    //     });
    //     this.oauth2Client.setCredentials(credentials);
    //   }
    //   let transporter = this.transporters.get(tenantId);
    //   if (!transporter) {
    //     transporter = nodemailer.createTransport({
    //       service: 'gmail',
    //       auth: {
    //         type: 'OAuth2',
    //         user: tenant.mailEmail!,
    //         clientId: process.env.GOOGLE_MAIL_CLIENT_ID,
    //         clientSecret: process.env.GOOGLE_MAIL_CLIENT_SECRET,
    //         refreshToken: tenant.mailRefreshToken,
    //         accessToken: tenant.mailAccessToken,
    //       },
    //     });
    //     this.transporters.set(tenantId, transporter);
    //   }
    //   await transporter.sendMail({
    //     from: tenant.mailEmail!,
    //     to: sendMailDto.to,
    //     subject: sendMailDto.subject,
    //     html: sendMailDto.html,
    //     text: sendMailDto.text,
    //   });
    // } catch (error) {
    //   this.transporters.delete(tenantId);
    //   throw new InternalServerErrorException('Failed to send email');
    // }
  }
}
