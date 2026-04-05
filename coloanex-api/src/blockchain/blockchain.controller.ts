import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Public()
  @Get('enabled')
  isEnabled() {
    return {
      enabled: this.blockchainService.isEnabled(),
    };
  }
}
