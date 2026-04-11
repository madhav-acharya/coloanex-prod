import { Module } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { PrismaService } from '../prisma.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { TransactionOrchestratorModule } from '../transaction-orchestrator/transaction-orchestrator.module';

@Module({
  imports: [BlockchainModule, TransactionOrchestratorModule],
  controllers: [RulesController],
  providers: [RulesService, PrismaService],
  exports: [RulesService],
})
export class RulesModule {}
