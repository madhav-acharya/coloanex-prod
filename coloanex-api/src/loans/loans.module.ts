import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PrismaService } from '../prisma.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { MailModule } from '../mail/mail.module';
import { ContractsModule } from '../contracts/contracts.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { TransactionOrchestratorModule } from '../transaction-orchestrator/transaction-orchestrator.module';

@Module({
  imports: [
    ActivityLogsModule,
    MailModule,
    ContractsModule,
    BlockchainModule,
    TransactionOrchestratorModule,
  ],
  controllers: [LoansController],
  providers: [LoansService, PrismaService],
  exports: [LoansService],
})
export class LoansModule {}
