import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [ActivityLogsService, PrismaService],
  exports: [ActivityLogsService, PrismaService],
})
export class ActivityLogsModule {}
