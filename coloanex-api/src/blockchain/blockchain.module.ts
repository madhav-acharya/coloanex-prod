import { Module } from '@nestjs/common';
import { LoanBlockchainService } from './services/loan.blockchain.service';
import { ContractBlockchainService } from './services/contract.blockchain.service';
import { PaymentBlockchainService } from './services/payment.blockchain.service';

@Module({
  providers: [
    LoanBlockchainService,
    ContractBlockchainService,
    PaymentBlockchainService,
  ],
  exports: [
    LoanBlockchainService,
    ContractBlockchainService,
    PaymentBlockchainService,
  ],
})
export class BlockchainModule {}
