import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PaymentSchedulesService } from './payment-schedules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payment-schedules')
@UseGuards(JwtAuthGuard)
export class PaymentSchedulesController {
  constructor(
    private readonly paymentSchedulesService: PaymentSchedulesService,
  ) {}

  @Get('contract/:contractId')
  findByContract(@Param('contractId') contractId: string) {
    return this.paymentSchedulesService.findByContract(contractId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentSchedulesService.findOne(id);
  }
}
