import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { UpsertPaymentConfigDto } from './dto/upsert-payment-config.dto';
import { PaymentConfigsService } from './payment-configs.service';

@Controller('payment-configs')
export class PaymentConfigsController {
  constructor(private readonly paymentConfigsService: PaymentConfigsService) {}

  @Post()
  upsert(@Body() dto: UpsertPaymentConfigDto, @Req() req: any) {
    return this.paymentConfigsService.upsert(dto, req.user);
  }

  @Get('me')
  findMine(@Req() req: any) {
    return this.paymentConfigsService.findMine(req.user);
  }

  @Get('tenant/:tenantId')
  findByTenant(@Param('tenantId') tenantId: string, @Req() req: any) {
    return this.paymentConfigsService.findByTenant(tenantId, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.paymentConfigsService.remove(id, req.user);
  }
}
