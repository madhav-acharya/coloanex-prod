import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { UsersModule } from './users/users.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { BorrowersModule } from './borrowers/borrowers.module';
import { TenantsModule } from './tenants/tenants.module';
import { KycModule } from './kyc/kyc.module';
import { LoansModule } from './loans/loans.module';
import { RulesModule } from './rules/rules.module';
import { ContractsModule } from './contracts/contracts.module';
import { PaymentSchedulesModule } from './payment-schedules/payment-schedules.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletsModule } from './wallets/wallets.module';
import { CloudinaryUploadsModule } from './cloudinary-uploads/cloudinary-uploads.module';
import { MailModule } from './mail/mail.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { IsUniqueConstraint } from './common/validators/is-unique.validator';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    PermissionsModule,
    UsersModule,
    ActivityLogsModule,
    BorrowersModule,
    TenantsModule,
    KycModule,
    LoansModule,
    RulesModule,
    ContractsModule,
    PaymentSchedulesModule,
    TransactionsModule,
    WalletsModule,
    CloudinaryUploadsModule,
    MailModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    IsUniqueConstraint,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
