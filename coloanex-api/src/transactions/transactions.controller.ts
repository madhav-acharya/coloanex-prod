import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionStatus } from './entities/transaction.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get('contract/:contractId')
  findByContract(@Param('contractId') contractId: string) {
    return this.transactionsService.findByContract(contractId);
  }

  @Get('wallet/:walletId')
  findByWallet(@Param('walletId') walletId: string) {
    return this.transactionsService.findByWallet(walletId);
  }

  @Get(':id/blockchain-history')
  getBlockchainHistory(@Param('id') id: string) {
    return this.transactionsService.getBlockchainHistory(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TransactionStatus,
  ) {
    return this.transactionsService.updateStatus(id, status);
  }
}
