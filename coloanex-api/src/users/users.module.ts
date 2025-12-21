import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [ActivityLogsModule, PermissionsModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
