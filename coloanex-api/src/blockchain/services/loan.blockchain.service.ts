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
      } else if (bcStatus === 'APPROVED') {
        throw new Error(
          `Loan ${id} is already approved and cannot be approved again`,
        );
      } else if (bcStatus === 'REJECTED') {
        throw new Error(`Loan ${id} has been rejected and cannot be approved`);
      } else if (bcStatus !== 'UNDER_REVIEW') {
        throw new Error(
          `Loan ${id} has invalid status '${bcStatus}' for approval. Expected 'UNDER_REVIEW'`,
        );
      }

      return await this.service.approveLoan(
        id,
        approvedAmount,
        approvedTermMonths,
      );
    } catch (error) {
      if (error?.message?.includes('must be UNDER_REVIEW to be approved')) {
        this.logBlockchainError(`approveLoan [${id}]`, error);
        throw new Error(
          `Cannot approve loan ${id}: The loan must be in review status to be approved. Current blockchain status may be out of sync.`,
        );
      }

      if (
        error?.message?.includes('already approved') ||
        error?.message?.includes('already rejected')
      ) {
        this.logBlockchainError(`approveLoan [${id}]`, error);
        throw error;
      }

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

  async verifyLoanOnChain(id: string): Promise<{
    exists: boolean;
    data?: any;
    onChain: boolean;
  }> {
    if (!this.enabled) {
      return { exists: false, onChain: false };
    }
    try {
      let exists = await this.service.loanExists(id);
      let data: any = null;
      let chaincodeName = 'loans';

      if (!exists) {
        try {
          const contractService =
            require('./contract.blockchain.service').ContractBlockchainService;
          const contractInstance = new contractService();
          if (contractInstance.enabled) {
            const contractExists =
              await contractInstance.service.contractExists(id);
            if (contractExists) {
              data = await contractInstance.service.getContract(id);
              chaincodeName = 'contracts';
              exists = true;
            }
          }
        } catch (err) {}

        if (!exists) {
          try {
            const paymentService =
              require('./payment.blockchain.service').PaymentBlockchainService;
            const paymentInstance = new paymentService();
            if (paymentInstance.enabled) {
              const paymentExists =
                await paymentInstance.service.paymentExists(id);
              if (paymentExists) {
                data = await paymentInstance.service.getPayment(id);
                chaincodeName = 'payments';
                exists = true;
              }
            }
          } catch (err) {}
        }
      } else {
        data = await this.service.getLoan(id);
      }

      if (!exists) {
        return { exists: false, onChain: false };
      }

      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      const enrichedData = {
        ...parsedData,
        chaincodeName: chaincodeName,
        channelName: 'coloanex-channel',
        mspId: 'Org1MSP',
        functionName:
          chaincodeName === 'loans'
            ? 'getLoan'
            : chaincodeName === 'contracts'
              ? 'getContract'
              : 'getPayment',
      };

      return {
        exists: true,
        onChain: true,
        data: enrichedData,
      };
    } catch (error) {
      this.logBlockchainError(`verifyLoanOnChain [${id}]`, error);
      return { exists: false, onChain: false };
    }
  }

  async verifyTransactionHash(
    id: string,
    txHash: string,
  ): Promise<{
    verified: boolean;
    transaction?: any;
    error?: string;
  }> {
    if (!this.enabled) {
      return { verified: false, error: 'Blockchain is disabled' };
    }

    try {
      const result = await this.service.verifyTransactionHash(id, txHash);
      const parsedResult =
        typeof result === 'string' ? JSON.parse(result) : result;

      return {
        verified: parsedResult.verified,
        transaction: parsedResult.transaction,
      };
    } catch (error) {
      this.logBlockchainError(
        `verifyTransactionHash [${id}] hash [${txHash}]`,
        error,
      );
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
