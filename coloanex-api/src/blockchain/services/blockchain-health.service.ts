import { Injectable, Logger } from '@nestjs/common';
import { LoanFabricService } from 'coloanex-fabric-client';
import { buildFabricConfig } from '../blockchain.config';

@Injectable()
export class BlockchainHealthService {
  private readonly logger = new Logger(BlockchainHealthService.name);
  private readonly enabled = process.env.BLOCKCHAIN_ENABLED === 'true';
  private readonly service: LoanFabricService;

  constructor() {
    this.service = new LoanFabricService(buildFabricConfig().loans);
  }

  async checkHealth(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      await this.service.connect();
      return true;
    } catch (error) {
      this.logger.warn('Blockchain health check failed:', error);
      return false;
    }
  }
}
