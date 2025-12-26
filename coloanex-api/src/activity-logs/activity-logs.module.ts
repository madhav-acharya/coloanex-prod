import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService, PrismaService],
  exports: [ActivityLogsService, PrismaService],
})
export class ActivityLogsModule {}
