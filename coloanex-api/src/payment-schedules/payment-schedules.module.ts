import { Module } from '@nestjs/common';
import { PaymentSchedulesService } from './payment-schedules.service';
import { PaymentSchedulesController } from './payment-schedules.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PaymentSchedulesController],
  providers: [PaymentSchedulesService, PrismaService],
  exports: [PaymentSchedulesService],
})
export class PaymentSchedulesModule {}
