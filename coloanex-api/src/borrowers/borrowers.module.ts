import { Module } from '@nestjs/common';
import { BorrowersService } from './borrowers.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  providers: [BorrowersService],
  exports: [BorrowersService],
})
export class BorrowersModule {}
