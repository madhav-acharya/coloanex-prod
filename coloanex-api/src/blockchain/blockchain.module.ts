import { Module } from '@nestjs/common';
import { LoanBlockchainService } from './services/loan.blockchain.service';
import { ContractBlockchainService } from './services/contract.blockchain.service';
import { PaymentBlockchainService } from './services/payment.blockchain.service';
import { BlockchainHealthService } from './services/blockchain-health.service';
import { BlockchainController } from './controllers/blockchain.controller';

@Module({
  controllers: [BlockchainController],
  providers: [
    LoanBlockchainService,
    ContractBlockchainService,
    PaymentBlockchainService,
    BlockchainHealthService,
  ],
  exports: [
    LoanBlockchainService,
    ContractBlockchainService,
    PaymentBlockchainService,
    BlockchainHealthService,
  ],
})
export class BlockchainModule {}
