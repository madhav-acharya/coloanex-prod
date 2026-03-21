import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PaymentFabricService } from 'coloanex-fabric-client';
import type { TransactionResult } from 'coloanex-fabric-client';
import { buildFabricConfig } from '../blockchain.config';

@Injectable()
export class PaymentBlockchainService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(PaymentBlockchainService.name);
  private readonly enabled = process.env.BLOCKCHAIN_ENABLED === 'true';
  private readonly service: PaymentFabricService;

  constructor() {
    this.service = new PaymentFabricService(buildFabricConfig().payments);
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.service.connect();
      this.logger.log('Connected to Fabric payments chaincode');
    } catch (error) {
      this.logBlockchainError('connect to payments chaincode', error);
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

  async recordPayment(
    id: string,
    contractId: string,
    borrowerId: string,
    tenantId: string,
    amount: string,
    paymentMethod: string,
    reference: string,
    installmentNumbers: number[],
    penaltyAmount: string,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.recordPayment(
        id,
        contractId,
        borrowerId,
        tenantId,
        amount,
        paymentMethod,
        reference,
        installmentNumbers,
        penaltyAmount,
      );
    } catch (error) {
      this.logBlockchainError(`recordPayment [${id}]`, error);
      return null;
    }
  }

  async updatePaymentStatus(
    id: string,
    newStatus: string,
    gatewayTransactionId?: string,
  ): Promise<TransactionResult | null> {
    if (!this.enabled) return null;
    try {
      return await this.service.updatePaymentStatus(
        id,
        newStatus,
        gatewayTransactionId,
      );
    } catch (error) {
      this.logBlockchainError(
        `updatePaymentStatus [${id}] -> ${newStatus}`,
        error,
      );
      return null;
    }
  }

  async getPaymentHistory(id: string): Promise<any> {
    if (!this.enabled) return null;
    try {
      return await this.service.getPaymentHistory(id);
    } catch (error) {
      this.logBlockchainError(`getPaymentHistory [${id}]`, error);
      throw error;
    }
  }

  async verifyPaymentOnChain(id: string): Promise<{
    exists: boolean;
    data?: any;
    onChain: boolean;
  }> {
    if (!this.enabled) {
      return { exists: false, onChain: false };
    }
    try {
      let exists = await this.service.paymentExists(id);
      let data: any = null;
      let chaincodeName = 'payments';

      if (!exists) {
        try {
          const loanService =
            require('./loan.blockchain.service').LoanBlockchainService;
          const loanInstance = new loanService();
          if (loanInstance.enabled) {
            const loanExists = await loanInstance.service.loanExists(id);
            if (loanExists) {
              data = await loanInstance.service.getLoan(id);
              chaincodeName = 'loans';
              exists = true;
            }
          }
        } catch (err) {}

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
        }
      } else {
        data = await this.service.getPayment(id);
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
      this.logBlockchainError(`verifyPaymentOnChain [${id}]`, error);
      return { exists: false, onChain: false };
    }
  }

}
