import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PrismaService } from '../prisma.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ActivityLogsModule, MailModule],
  controllers: [LoansController],
  providers: [LoansService, PrismaService],
  exports: [LoansService],
})
export class LoansModule {}
