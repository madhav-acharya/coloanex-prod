import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
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
  create(@Body() createTransactionDto: CreateTransactionDto, @Req() req: any) {
    return this.transactionsService.create(createTransactionDto, req.user);
  }

  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get('contract/:contractId')
  findByContract(@Param('contractId') contractId: string) {
    return this.transactionsService.findByContract(contractId);
  }

  @Get('entity/:id')
  findByEntity(@Param('id') id: string) {
    return this.transactionsService.findByEntity(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TransactionStatus,
    @Req() req: any,
  ) {
    return this.transactionsService.updateStatus(id, status, req.user);
  }
}
