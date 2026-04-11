import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GasResolverService } from './gas-resolver.service';
import { SubscriptionResolverService } from './subscription-resolver.service';
import { TransactionOrchestratorService } from './transaction-orchestrator.service';
import { TransactionPolicyEngineService } from './transaction-policy-engine.service';
import { WalletResolverService } from './wallet-resolver.service';

@Module({
  providers: [
    PrismaService,
    GasResolverService,
    SubscriptionResolverService,
    WalletResolverService,
    TransactionPolicyEngineService,
    TransactionOrchestratorService,
  ],
  exports: [TransactionOrchestratorService, SubscriptionResolverService],
})
export class TransactionOrchestratorModule {}
