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
      this.logger.error('Failed to connect to Fabric loans chaincode', error);
    }
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
      this.logger.error(
        `Failed to record createLoan on blockchain [${id}]`,
        error,
      );
      return null;
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
      this.logger.error(
        `Failed to record updateLoanStatus on blockchain [${id}]`,
        error,
      );
      return null;
    }
  }

  async approveLoan(
    id: string,
    approvedAmount: string,
    approvedTermMonths: number,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.approveLoan(
        id,
        approvedAmount,
        approvedTermMonths,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record approveLoan on blockchain [${id}]`,
        error,
      );
      return null;
    }
  }
}
