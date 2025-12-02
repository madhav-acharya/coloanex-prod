import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { BorrowersModule } from '../borrowers/borrowers.module';

@Module({
  imports: [ActivityLogsModule, BorrowersModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
