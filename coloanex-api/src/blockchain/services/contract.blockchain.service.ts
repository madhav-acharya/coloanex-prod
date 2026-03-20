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
      this.logBlockchainError('connect to contracts chaincode', error);
    }
  }

  private logBlockchainError(operation: string, error: unknown): void {
    const e = error as any;
    const parts: string[] = [];
    if (e?.message) parts.push(e.message);
    if (e?.code !== undefined) parts.push(`gRPC code=${e.code}`);
    if (e?.details) {
      const details = Array.isArray(e.details)
        ? e.details
            .map(
              (d: any) =>
                `[${d.mspId ?? '?'}@${d.address ?? '?'}: ${d.message ?? JSON.stringify(d)}]`,
            )
            .join(', ')
        : JSON.stringify(e.details);
      parts.push(`details: ${details}`);
    }
    this.logger.error(
      `Blockchain error — ${operation}: ${parts.join(' | ') || String(error)}`,
      e?.stack,
    );
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
      this.logBlockchainError(`createContract [${id}]`, error);
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
      this.logBlockchainError(`signContract [${id}]`, error);
      return null;
    }
  }

  async activateContract(id: string): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.activateContract(id);
    } catch (error) {
      this.logBlockchainError(`activateContract [${id}]`, error);
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
      this.logBlockchainError(`recordDisbursement [${id}]`, error);
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
      this.logBlockchainError(`updatePaymentBalance [${id}]`, error);
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
      this.logBlockchainError(
        `updateContractStatus [${id}] -> ${newStatus}`,
        error,
      );
      return null;
    }
  }

  async getContractHistory(id: string): Promise<any> {
    if (!this.enabled) return null;
    try {
      return await this.service.getContractHistory(id);
    } catch (error) {
      this.logBlockchainError(`getContractHistory [${id}]`, error);
      throw error;
    }
  }
}
