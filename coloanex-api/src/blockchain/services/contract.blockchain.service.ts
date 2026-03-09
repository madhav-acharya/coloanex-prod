import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ContractFabricService } from 'coloanex-fabric-client';
import type { TransactionResult } from 'coloanex-fabric-client';
import { buildFabricConfig } from '../blockchain.config';

@Injectable()
export class ContractBlockchainService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ContractBlockchainService.name);
  private readonly enabled = process.env.BLOCKCHAIN_ENABLED === 'true';
  private readonly service: ContractFabricService;

  constructor() {
    this.service = new ContractFabricService(buildFabricConfig().contracts);
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.service.connect();
      this.logger.log('Connected to Fabric contracts chaincode');
    } catch (error) {
      this.logger.error(
        'Failed to connect to Fabric contracts chaincode',
        error,
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.enabled) return;
    await this.service.disconnect();
  }

  async createContract(
    id: string,
    contractNumber: string,
    tenantId: string,
    borrowerId: string,
    loanId: string,
    ruleId: string,
    startDate: string,
    endDate: string,
    loanAmount: string,
    interestRate: string,
    termMonths: number,
    paymentFrequency: string,
    installmentAmount: string,
    totalInstallments: number,
    totalAmountDue: string,
    termsAndConditions: string,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.createContract(
        id,
        contractNumber,
        tenantId,
        borrowerId,
        loanId,
        ruleId,
        startDate,
        endDate,
        loanAmount,
        interestRate,
        termMonths,
        paymentFrequency,
        installmentAmount,
        totalInstallments,
        totalAmountDue,
        termsAndConditions,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record createContract on blockchain [${id}]`,
        error,
      );
      return null;
    }
  }

  async signContract(
    id: string,
    signerId: string,
    signerRole: string,
    signatureHash: string,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.signContract(
        id,
        signerId,
        signerRole,
        signatureHash,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record signContract on blockchain [${id}]`,
        error,
      );
      return null;
    }
  }

  async activateContract(id: string): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.activateContract(id);
    } catch (error) {
      this.logger.error(
        `Failed to record activateContract on blockchain [${id}]`,
        error,
      );
      return null;
    }
  }

  async recordDisbursement(
    id: string,
    disbursedAmount: string,
    method: string,
    reference: string,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.recordDisbursement(
        id,
        disbursedAmount,
        method,
        reference,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record disbursement on blockchain [${id}]`,
        error,
      );
      return null;
    }
  }

  async updatePaymentBalance(
    id: string,
    paymentAmount: string,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.updatePaymentBalance(id, paymentAmount);
    } catch (error) {
      this.logger.error(
        `Failed to record updatePaymentBalance on blockchain [${id}]`,
        error,
      );
      return null;
    }
  }

  async updateContractStatus(
    id: string,
    newStatus: string,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.updateContractStatus(id, newStatus);
    } catch (error) {
      this.logger.error(
        `Failed to record updateContractStatus on blockchain [${id}]`,
        error,
      );
      return null;
    }
  }
}
