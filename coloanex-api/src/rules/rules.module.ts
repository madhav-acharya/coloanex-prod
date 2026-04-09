import { Module } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { PrismaService } from '../prisma.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [RulesController],
  providers: [RulesService, PrismaService],
  exports: [RulesService],
})
export class RulesModule {}
