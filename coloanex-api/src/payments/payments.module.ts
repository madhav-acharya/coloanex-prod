import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EsewaGateway } from './gateways/esewa/esewa.gateway';
import { KhaltiGateway } from './gateways/khalti/khalti.gateway';
import type { IPaymentGateway } from './gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY_REGISTRY } from './gateways/payment-gateway.interface';
import { PrismaService } from '../prisma.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { PaymentConfigsModule } from '../payment-configs/payment-configs.module';
import { TransactionOrchestratorModule } from '../transaction-orchestrator/transaction-orchestrator.module';

const gateways: (new () => IPaymentGateway)[] = [EsewaGateway, KhaltiGateway];

@Module({
  imports: [
    BlockchainModule,
    PaymentConfigsModule,
    TransactionOrchestratorModule,
  ],
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
