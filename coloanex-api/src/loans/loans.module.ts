import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PrismaService } from '../prisma.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [LoansController],
  providers: [LoansService, PrismaService],
  exports: [LoansService],
})
export class LoansModule {}
