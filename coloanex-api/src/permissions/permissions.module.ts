import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PermissionAssignmentService } from './permission-assignment.service';
import { PrismaService } from 'src/prisma.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionAssignmentService, PrismaService],
  exports: [PermissionsService, PermissionAssignmentService],
})
export class PermissionsModule {}
