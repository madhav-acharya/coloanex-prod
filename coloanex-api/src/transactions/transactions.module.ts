import { Module, forwardRef } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaService } from '../prisma.service';

import { BlockchainModule } from '../blockchain/blockchain.module';
import { TransactionOrchestratorModule } from '../transaction-orchestrator/transaction-orchestrator.module';

@Module({
  imports: [BlockchainModule, TransactionOrchestratorModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, PrismaService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
