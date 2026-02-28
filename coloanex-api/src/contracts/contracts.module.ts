import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { PrismaService } from '../prisma.service';
import { CloudinaryUploadsModule } from '../cloudinary-uploads/cloudinary-uploads.module';
import { MailModule } from '../mail/mail.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [CloudinaryUploadsModule, MailModule, ActivityLogsModule],
  controllers: [ContractsController],
  providers: [ContractsService, PrismaService],
  exports: [ContractsService],
})
export class ContractsModule {}
