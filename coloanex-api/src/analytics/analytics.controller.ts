import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('admin')
  getAdminAnalytics(@CurrentUser() user: any) {
    return this.analyticsService.getAdminAnalytics(user);
  }

  @Get('tenant')
  getTenantAnalytics(
    @CurrentUser() user: any,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.analyticsService.getTenantAnalytics(user, tenantId);
  }

  @Get('borrower')
  getBorrowerAnalytics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getBorrowerAnalytics(user, startDate, endDate);
  }

  @Get('contracts/monthly')
  getMonthlyContracts(
    @CurrentUser() user: any,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getMonthlyContracts(
      user,
      months ? parseInt(months) : 12,
    );
  }

  @Get('loans/monthly')
  getMonthlyLoans(
    @CurrentUser() user: any,
    @Query('months') months?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getMonthlyLoans(
      user,
      months ? parseInt(months) : 12,
      startDate,
      endDate,
    );
  }

  @Get('loans/status')
  getLoansByStatus(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getLoansByStatus(user, startDate, endDate);
  }

  @Get('contracts/status')
  getContractsByStatus(@CurrentUser() user: any) {
    return this.analyticsService.getContractsByStatus(user);
  }

  @Get('revenue/monthly')
  getMonthlyRevenue(
    @CurrentUser() user: any,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getMonthlyRevenue(
      user,
      months ? parseInt(months) : 12,
    );
  }

  @Get('users/monthly')
  getMonthlyUsers(@CurrentUser() user: any, @Query('months') months?: string) {
    return this.analyticsService.getMonthlyUsers(
      user,
      months ? parseInt(months) : 12,
    );
  }

  @Get('users/by-role')
  getUsersByRole(@CurrentUser() user: any) {
    return this.analyticsService.getUsersByRole(user);
  }
  @Get('borrowers/monthly')
  getMonthlyBorrowers(
    @CurrentUser() user: any,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getMonthlyBorrowers(
      user,
      months ? parseInt(months) : 12,
    );
  }

  @Get('borrowers/monthly-loans')
  getBorrowerMonthlyLoans(
    @CurrentUser() user: any,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getBorrowerMonthlyLoans(
      user,
      months ? parseInt(months) : 12,
    );
  }

  @Get('borrowers/by-status')
  getBorrowersByStatus(@CurrentUser() user: any) {
    return this.analyticsService.getBorrowersByStatus(user);
  }
}
