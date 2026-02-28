import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EsewaGateway } from './gateways/esewa/esewa.gateway';
import type { IPaymentGateway } from './gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY_REGISTRY } from './gateways/payment-gateway.interface';
import { PrismaService } from '../prisma.service';

const gateways: (new () => IPaymentGateway)[] = [EsewaGateway];

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PrismaService,
    ...gateways,
    {
      provide: PAYMENT_GATEWAY_REGISTRY,
      useFactory: (...instances: IPaymentGateway[]) => {
        return new Map(instances.map((g) => [g.key.toUpperCase(), g]));
      },
      inject: gateways,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
