import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentConfigsController } from './payment-configs.controller';
import { PaymentConfigsService } from './payment-configs.service';

@Module({
  controllers: [PaymentConfigsController],
  providers: [PaymentConfigsService, PrismaService],
  exports: [PaymentConfigsService],
})
export class PaymentConfigsModule {}
