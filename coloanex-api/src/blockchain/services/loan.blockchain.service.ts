import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { LoanFabricService } from 'coloanex-fabric-client';
import type { TransactionResult } from 'coloanex-fabric-client';
import { buildFabricConfig } from '../blockchain.config';

@Injectable()
export class LoanBlockchainService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(LoanBlockchainService.name);
  private readonly enabled = process.env.BLOCKCHAIN_ENABLED === 'true';
  private readonly service: LoanFabricService;

  constructor() {
    this.service = new LoanFabricService(buildFabricConfig().loans);
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.service.connect();
      this.logger.log('Connected to Fabric loans chaincode');
    } catch (error) {
      this.logBlockchainError('connect to loans chaincode', error);
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

  async createLoan(
    id: string,
    borrowerId: string,
    tenantId: string,
    requestedAmount: string,
    purpose: string,
    collateralDetails: Record<string, unknown>,
    requestedTermMonths: number,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.createLoan(
        id,
        borrowerId,
        tenantId,
        requestedAmount,
        purpose,
        collateralDetails,
        requestedTermMonths,
      );
    } catch (error) {
      this.logBlockchainError(`createLoan [${id}]`, error);
      throw error;
    }
  }

  async updateLoanStatus(
    id: string,
    newStatus: string,
    reason?: string,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.updateLoanStatus(id, newStatus, reason);
    } catch (error) {
      this.logBlockchainError(
        `updateLoanStatus [${id}] -> ${newStatus}`,
        error,
      );
      throw error;
    }
  }

  async approveLoan(
    id: string,
    approvedAmount: string,
    approvedTermMonths: number,
    loanRecord?: {
      borrowerId: string;
      tenantId: string;
      requestedAmount: string;
      purpose: string;
      collateralDetails: Record<string, unknown>;
      requestedTermMonths: number;
    },
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      let bcStatus: string;
      try {
        const loanData = (await this.service.getLoan(id)) as any;
        bcStatus = loanData?.status ?? 'DRAFT';
      } catch {
        if (!loanRecord) {
          throw new Error(
            `Loan ${id} does not exist on chain and no loanRecord was provided to create it`,
          );
        }
        await this.service.createLoan(
          id,
          loanRecord.borrowerId,
          loanRecord.tenantId,
          loanRecord.requestedAmount,
          loanRecord.purpose,
          loanRecord.collateralDetails,
          loanRecord.requestedTermMonths,
        );
        bcStatus = 'DRAFT';
      }
      if (bcStatus === 'DRAFT') {
        await this.service.updateLoanStatus(id, 'PENDING');
        await this.service.updateLoanStatus(id, 'UNDER_REVIEW');
      } else if (bcStatus === 'PENDING') {
        await this.service.updateLoanStatus(id, 'UNDER_REVIEW');
      }
      return await this.service.approveLoan(
        id,
        approvedAmount,
        approvedTermMonths,
      );
    } catch (error) {
      this.logBlockchainError(`approveLoan [${id}]`, error);
      throw error;
    }
  }

  async getLoanHistory(id: string): Promise<any> {
    if (!this.enabled) return null;
    try {
      return await this.service.getLoanHistory(id);
    } catch (error) {
      this.logBlockchainError(`getLoanHistory [${id}]`, error);
      throw error;
    }
  }
}
