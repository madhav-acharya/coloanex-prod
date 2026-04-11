import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() dto: CreateSubscriptionDto, @Req() req: any) {
    return this.subscriptionsService.create(dto, req.user);
  }

  @Post('plans')
  createPlan(@Body() dto: CreateSubscriptionPlanDto, @Req() req: any) {
    return this.subscriptionsService.createPlan(dto, req.user);
  }

  @Public()
  @Get('plans')
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @Get('me')
  listMine(@Req() req: any) {
    return this.subscriptionsService.listMine(req.user);
  }

  @Post('purchase')
  purchase(@Body() dto: PurchaseSubscriptionDto, @Req() req: any) {
    return this.subscriptionsService.purchase(dto, req.user);
  }

  @Post(':id/select')
  select(@Param('id') id: string, @Req() req: any) {
    return this.subscriptionsService.selectSubscription(id, req.user);
  }

  @Patch('plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
    @Req() req: any,
  ) {
    return this.subscriptionsService.updatePlan(id, dto, req.user);
  }

  @Delete('plans/:id')
  removePlan(@Param('id') id: string, @Req() req: any) {
    return this.subscriptionsService.removePlan(id, req.user);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.subscriptionsService.findAll(req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
    @Req() req: any,
  ) {
    return this.subscriptionsService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.subscriptionsService.remove(id, req.user);
  }
}
