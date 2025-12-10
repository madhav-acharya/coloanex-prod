import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BorrowersService } from './borrowers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { READ_KYC_DOCUMENTS } from '../common/constants/permissions.constants';

@Controller('borrowers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BorrowersController {
  constructor(private readonly borrowersService: BorrowersService) {}

  @Get()
  @RequirePermissions(READ_KYC_DOCUMENTS)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @CurrentUser() user: JwtPayload,
  ) {
    const borrowers = await this.borrowersService.findByTenant(
      user.tenantId ?? '',
    );
    return {
      data: borrowers,
      total: borrowers.length,
      page: Number(page),
      limit: Number(limit),
    };
  }
}
