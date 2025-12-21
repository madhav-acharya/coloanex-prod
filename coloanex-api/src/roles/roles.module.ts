import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaService } from 'src/prisma.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [ActivityLogsModule, PermissionsModule],
  controllers: [RolesController],
  providers: [RolesService, PrismaService],
  exports: [RolesService],
})
export class RolesModule {}
