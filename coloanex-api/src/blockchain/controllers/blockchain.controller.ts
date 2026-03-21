import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BlockchainHealthService } from '../services/blockchain-health.service';

@Controller('blockchain')
@UseGuards(JwtAuthGuard)
export class BlockchainController {
  constructor(
    private readonly blockchainHealthService: BlockchainHealthService,
  ) {}

  @Get('health')
  async getHealth() {
    const isEnabled = await this.blockchainHealthService.checkHealth();
    return {
      enabled: isEnabled,
      status: isEnabled ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }
}
