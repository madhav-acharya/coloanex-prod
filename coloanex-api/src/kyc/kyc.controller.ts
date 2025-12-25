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
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import type { KycQueryInterface } from './interfaces/kyc-query.interface';
import {
  READ_KYC_DOCUMENTS,
  CREATE_KYC_DOCUMENTS,
  UPDATE_KYC_DOCUMENTS,
  DELETE_KYC_DOCUMENTS,
  APPROVE_KYC_DOCUMENTS,
} from '../common/constants/permissions.constants';
import { getClientIpAddress } from '../common/helpers/ip-address.helper';

@Controller('kyc')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @RequirePermissions(CREATE_KYC_DOCUMENTS)
  create(
    @Body() createKycDto: CreateKycDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.get('User-Agent');
    return this.kycService.create(createKycDto, user, ipAddress, userAgent);
  }

  @Get()
  @RequirePermissions(READ_KYC_DOCUMENTS)
  findAll(@Query() query: KycQueryInterface, @CurrentUser() user: JwtPayload) {
    return this.kycService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions(READ_KYC_DOCUMENTS)
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.kycService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions(UPDATE_KYC_DOCUMENTS)
  update(
    @Param('id') id: string,
    @Body() updateKycDto: UpdateKycDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.get('User-Agent');
    return this.kycService.update(id, updateKycDto, user, ipAddress, userAgent);
  }

  @Post(':id/verify')
  @RequirePermissions(APPROVE_KYC_DOCUMENTS)
  verify(
    @Param('id') id: string,
    @Body() verifyKycDto: VerifyKycDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.get('User-Agent');
    return this.kycService.verify(id, verifyKycDto, user, ipAddress, userAgent);
  }

  @Delete(':id')
  @RequirePermissions(DELETE_KYC_DOCUMENTS)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.get('User-Agent');
    return this.kycService.remove(id, user, ipAddress, userAgent);
  }
}
