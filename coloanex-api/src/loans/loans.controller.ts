import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ReviewLoanDto } from './dto/review-loan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import type { LoanQueryInterface } from './interfaces/loan-query.interface';
import {
  READ_LOANS,
  CREATE_LOANS,
  UPDATE_LOANS,
  DELETE_LOANS,
  APPROVE_LOANS,
} from '../common/constants/permissions.constants';
import { getClientIpAddress } from '../common/helpers/ip-address.helper';

@Controller('loans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @RequirePermissions(CREATE_LOANS)
  create(
    @Body() createLoanDto: CreateLoanDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.get('User-Agent');
    return this.loansService.create(createLoanDto, user, ipAddress, userAgent);
  }

  @Get('my-loans')
  @RequirePermissions(READ_LOANS)
  getMyLoans(@CurrentUser() user: JwtPayload) {
    return this.loansService.getMyLoans(user);
  }

  @Get('check-existing/:tenantId')
  @RequirePermissions(READ_LOANS)
  checkExisting(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.loansService.checkExistingLoan(tenantId, user);
  }

  @Get()
  @RequirePermissions(READ_LOANS)
  findAll(@Query() query: LoanQueryInterface, @CurrentUser() user: JwtPayload) {
    return this.loansService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions(READ_LOANS)
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.loansService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions(UPDATE_LOANS)
  update(
    @Param('id') id: string,
    @Body() updateLoanDto: UpdateLoanDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.get('User-Agent');
    return this.loansService.update(
      id,
      updateLoanDto,
      user,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id/payment-schedule')
  @RequirePermissions(READ_LOANS)
  getPaymentSchedule(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.loansService.getPaymentSchedule(id, user);
  }

  @Post(':id/payment')
  @RequirePermissions(CREATE_LOANS)
  makePayment(
    @Param('id') id: string,
    @Body() paymentDto: { amount: number; paymentMethodId?: string },
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.get('User-Agent');
    return this.loansService.makePayment(
      id,
      paymentDto.amount,
      user,
      ipAddress,
      userAgent,
      paymentDto.paymentMethodId,
    );
  }

  @Post(':id/review')
  @RequirePermissions(APPROVE_LOANS)
  review(
    @Param('id') id: string,
    @Body() reviewLoanDto: ReviewLoanDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.get('User-Agent');
    return this.loansService.review(
      id,
      reviewLoanDto,
      user,
      ipAddress,
      userAgent,
    );
  }

  @Delete(':id')
  @RequirePermissions(DELETE_LOANS)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.get('User-Agent');
    return this.loansService.remove(id, user, ipAddress, userAgent);
  }
}
