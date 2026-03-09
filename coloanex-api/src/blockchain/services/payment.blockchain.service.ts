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
      this.logger.error(
        'Failed to connect to Fabric payments chaincode',
        error,
      );
    }
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
      this.logger.error(
        `Failed to record payment on blockchain [${id}]`,
        error,
      );
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
      this.logger.error(
        `Failed to record updatePaymentStatus on blockchain [${id}]`,
        error,
      );
      return null;
    }
  }
}
