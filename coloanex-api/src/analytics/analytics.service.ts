import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private calculatePercentageChange(current: number, previous: number) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  async getAdminAnalytics(user: any) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const [
      totalTenants,
      totalUsers,
      totalLoans,
      totalContracts,
      totalTransactions,
      activeTenants,
      pendingKYCs,
      totalLoanAmount,
      totalContractAmount,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count(),
      this.prisma.loan.count(),
      this.prisma.contract.count(),
      this.prisma.transaction.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.kyc.count({ where: { status: 'PENDING' } }),
      this.prisma.loan.aggregate({
        _sum: { requestedAmount: true },
      }),
      this.prisma.contract.aggregate({
        _sum: { loanAmount: true },
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalLoans,
      totalContracts,
      totalTransactions,
      pendingKYCs,
      totalLoanAmount: totalLoanAmount._sum.requestedAmount || 0,
      totalContractAmount: totalContractAmount._sum.loanAmount || 0,
    };
  }

  async getTenantAnalytics(
    user: any,
    tenantId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const isSuperAdmin = user.roles?.includes('Super Admin');
    const isLender = user.roles?.includes('Lender');

    const effectiveTenantId = tenantId || user.tenantId;

    if (!isSuperAdmin && !effectiveTenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    if (!isSuperAdmin && !isLender && user.tenantId !== effectiveTenantId) {
      throw new ForbiddenException('Access denied');
    }

    const borrowerWhere =
      isSuperAdmin && !effectiveTenantId ? {} : { tenantId: effectiveTenantId };
    const loanWhere =
      isSuperAdmin && !effectiveTenantId ? {} : { tenantId: effectiveTenantId };
    const contractWhere =
      isSuperAdmin && !effectiveTenantId ? {} : { tenantId: effectiveTenantId };
    const kycWhere =
      isSuperAdmin && !effectiveTenantId
        ? {}
        : { borrower: { tenantId: effectiveTenantId } };
    const transactionContractWhere =
      isSuperAdmin && !effectiveTenantId
        ? {}
        : { contract: { tenantId: effectiveTenantId } };
    const scheduleContractWhere =
      isSuperAdmin && !effectiveTenantId
        ? {}
        : { contract: { tenantId: effectiveTenantId } };

    const now = new Date();
    const selectedRange = this.buildCreatedAtFilter(startDate, endDate);
    const currentRangeStart =
      selectedRange?.gte || new Date(now.getFullYear(), now.getMonth(), 1);
    const currentRangeEnd = selectedRange?.lte || now;
    const rangeDuration =
      currentRangeEnd.getTime() - currentRangeStart.getTime();
    const previousRangeEnd = new Date(currentRangeStart.getTime() - 1);
    const previousRangeStart = new Date(
      previousRangeEnd.getTime() - rangeDuration,
    );

    const [
      totalBorrowers,
      totalLoans,
      activeLoans,
      totalContracts,
      activeContracts,
      pendingKYCs,
      verifiedKYCs,
      totalDisbursed,
      totalCollected,
      pendingPayments,
      borrowersCurrentMonth,
      borrowersPreviousMonth,
      loansCurrentMonth,
      loansPreviousMonth,
      activeLoansBeforeCurrentMonth,
      contractsCurrentMonth,
      contractsPreviousMonth,
      activeContractsBeforeCurrentMonth,
      verifiedKycsCurrentMonth,
      verifiedKycsPreviousMonth,
      pendingKycsCurrentMonth,
      pendingKycsPreviousMonth,
      disbursedCurrentMonth,
      disbursedPreviousMonth,
      collectedCurrentMonth,
      collectedPreviousMonth,
      pendingPaymentsCurrentMonth,
      pendingPaymentsPreviousMonth,
      borrowerSeriesRows,
      loanSeriesRows,
      contractSeriesRows,
      verifiedKycSeriesRows,
      pendingKycSeriesRows,
      collectedSeriesRows,
      pendingPaymentSeriesRows,
    ] = await Promise.all([
      this.prisma.borrower.count({
        where: {
          ...borrowerWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.loan.count({
        where: {
          ...loanWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.loan.count({
        where: {
          ...loanWhere,
          status: { in: ['CONTRACT_SIGNED', 'LOAN_PROVIDED'] },
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.contract.count({
        where: {
          ...contractWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.contract.count({
        where: {
          ...contractWhere,
          status: 'ACTIVE',
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.kyc.count({
        where: {
          ...kycWhere,
          status: 'PENDING',
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.kyc.count({
        where: {
          ...kycWhere,
          status: 'VERIFIED',
          updatedAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.contract.aggregate({
        where: {
          ...contractWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        _sum: { loanAmount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...transactionContractWhere,
          type: { in: ['INSTALLMENT_PAYMENT', 'PENALTY_PAYMENT'] },
          status: 'COMPLETED',
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.paymentSchedule.aggregate({
        where: {
          ...scheduleContractWhere,
          status: 'PENDING',
          dueDate: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.borrower.count({
        where: {
          ...borrowerWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.borrower.count({
        where: {
          ...borrowerWhere,
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.loan.count({
        where: {
          ...loanWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.loan.count({
        where: {
          ...loanWhere,
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.loan.count({
        where: {
          ...loanWhere,
          status: { in: ['CONTRACT_SIGNED', 'LOAN_PROVIDED'] },
          createdAt: { lte: previousRangeEnd },
        },
      }),
      this.prisma.contract.count({
        where: {
          ...contractWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.contract.count({
        where: {
          ...contractWhere,
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.contract.count({
        where: {
          ...contractWhere,
          status: 'ACTIVE',
          createdAt: { lte: previousRangeEnd },
        },
      }),
      this.prisma.kyc.count({
        where: {
          ...kycWhere,
          status: 'VERIFIED',
          updatedAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.kyc.count({
        where: {
          ...kycWhere,
          status: 'VERIFIED',
          updatedAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.kyc.count({
        where: {
          ...kycWhere,
          status: 'PENDING',
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
      }),
      this.prisma.kyc.count({
        where: {
          ...kycWhere,
          status: 'PENDING',
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.contract.aggregate({
        where: {
          ...contractWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        _sum: { loanAmount: true },
      }),
      this.prisma.contract.aggregate({
        where: {
          ...contractWhere,
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
        _sum: { loanAmount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...transactionContractWhere,
          type: { in: ['INSTALLMENT_PAYMENT', 'PENALTY_PAYMENT'] },
          status: 'COMPLETED',
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...transactionContractWhere,
          type: { in: ['INSTALLMENT_PAYMENT', 'PENALTY_PAYMENT'] },
          status: 'COMPLETED',
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.paymentSchedule.aggregate({
        where: {
          ...scheduleContractWhere,
          status: 'PENDING',
          dueDate: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.paymentSchedule.aggregate({
        where: {
          ...scheduleContractWhere,
          status: 'PENDING',
          dueDate: { gte: previousRangeStart, lte: previousRangeEnd },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.borrower.findMany({
        where: {
          ...borrowerWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        select: { createdAt: true },
      }),
      this.prisma.loan.findMany({
        where: {
          ...loanWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        select: { createdAt: true, status: true },
      }),
      this.prisma.contract.findMany({
        where: {
          ...contractWhere,
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        select: { createdAt: true, status: true, loanAmount: true },
      }),
      this.prisma.kyc.findMany({
        where: {
          ...kycWhere,
          status: 'VERIFIED',
          updatedAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        select: { updatedAt: true },
      }),
      this.prisma.kyc.findMany({
        where: {
          ...kycWhere,
          status: 'PENDING',
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        select: { createdAt: true },
      }),
      this.prisma.transaction.findMany({
        where: {
          ...transactionContractWhere,
          type: { in: ['INSTALLMENT_PAYMENT', 'PENALTY_PAYMENT'] },
          status: 'COMPLETED',
          createdAt: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        select: { createdAt: true, amount: true },
      }),
      this.prisma.paymentSchedule.findMany({
        where: {
          ...scheduleContractWhere,
          status: 'PENDING',
          dueDate: { gte: currentRangeStart, lte: currentRangeEnd },
        },
        select: { dueDate: true, totalAmount: true },
      }),
    ]);

    const trendPercentages = {
      newBorrowers: this.calculatePercentageChange(
        borrowersCurrentMonth,
        borrowersPreviousMonth,
      ),
      periodLoans: this.calculatePercentageChange(
        loansCurrentMonth,
        loansPreviousMonth,
      ),
      activeLoans: this.calculatePercentageChange(
        activeLoans,
        activeLoansBeforeCurrentMonth,
      ),
      periodContracts: this.calculatePercentageChange(
        contractsCurrentMonth,
        contractsPreviousMonth,
      ),
      verifiedBorrowers: this.calculatePercentageChange(
        verifiedKycsCurrentMonth,
        verifiedKycsPreviousMonth,
      ),
      pendingKYCs: this.calculatePercentageChange(
        pendingKycsCurrentMonth,
        pendingKycsPreviousMonth,
      ),
      activeContracts: this.calculatePercentageChange(
        activeContracts,
        activeContractsBeforeCurrentMonth,
      ),
      periodDisbursed: this.calculatePercentageChange(
        Number(disbursedCurrentMonth._sum.loanAmount || 0),
        Number(disbursedPreviousMonth._sum.loanAmount || 0),
      ),
      periodCollected: this.calculatePercentageChange(
        Number(collectedCurrentMonth._sum.amount || 0),
        Number(collectedPreviousMonth._sum.amount || 0),
      ),
      pendingPayments: this.calculatePercentageChange(
        Number(pendingPaymentsCurrentMonth._sum.totalAmount || 0),
        Number(pendingPaymentsPreviousMonth._sum.totalAmount || 0),
      ),
    };

    const trendSeries = {
      newBorrowers: this.groupByDynamicRange(
        borrowerSeriesRows,
        currentRangeStart,
        currentRangeEnd,
        () => 1,
      ).map((item) => ({ month: item.month, value: item.count })),
      periodLoans: this.groupByDynamicRange(
        loanSeriesRows,
        currentRangeStart,
        currentRangeEnd,
        () => 1,
      ).map((item) => ({ month: item.month, value: item.count })),
      activeLoans: this.groupByDynamicRange(
        loanSeriesRows.filter((loan) =>
          ['CONTRACT_SIGNED', 'LOAN_PROVIDED'].includes(String(loan.status)),
        ),
        currentRangeStart,
        currentRangeEnd,
        () => 1,
      ).map((item) => ({ month: item.month, value: item.count })),
      periodContracts: this.groupByDynamicRange(
        contractSeriesRows,
        currentRangeStart,
        currentRangeEnd,
        () => 1,
      ).map((item) => ({ month: item.month, value: item.count })),
      verifiedBorrowers: this.groupByDynamicRange(
        verifiedKycSeriesRows.map((row) => ({ createdAt: row.updatedAt })),
        currentRangeStart,
        currentRangeEnd,
        () => 1,
      ).map((item) => ({ month: item.month, value: item.count })),
      pendingKYCs: this.groupByDynamicRange(
        pendingKycSeriesRows,
        currentRangeStart,
        currentRangeEnd,
        () => 1,
      ).map((item) => ({ month: item.month, value: item.count })),
      activeContracts: this.groupByDynamicRange(
        contractSeriesRows.filter((contract) => contract.status === 'ACTIVE'),
        currentRangeStart,
        currentRangeEnd,
        () => 1,
      ).map((item) => ({ month: item.month, value: item.count })),
      periodDisbursed: this.groupByDynamicRange(
        contractSeriesRows,
        currentRangeStart,
        currentRangeEnd,
        (row) => Number(row.loanAmount || 0),
      ).map((item) => ({ month: item.month, value: item.count })),
      periodCollected: this.groupByDynamicRange(
        collectedSeriesRows,
        currentRangeStart,
        currentRangeEnd,
        (row) => Number(row.amount || 0),
      ).map((item) => ({ month: item.month, value: item.count })),
      pendingPayments: this.groupByDynamicRange(
        pendingPaymentSeriesRows.map((row) => ({
          createdAt: row.dueDate,
          totalAmount: row.totalAmount,
        })),
        currentRangeStart,
        currentRangeEnd,
        (row) => Number(row.totalAmount || 0),
      ).map((item) => ({ month: item.month, value: item.count })),
    };

    return {
      totalBorrowers,
      totalLoans,
      activeLoans,
      totalContracts,
      activeContracts,
      pendingKYCs,
      verifiedKYCs,
      totalDisbursed: totalDisbursed._sum.loanAmount || 0,
      totalCollected: totalCollected._sum.amount || 0,
      pendingPayments: pendingPayments._sum?.totalAmount || 0,
      trendPercentages,
      trendSeries,
    };
  }

  private buildCreatedAtFilter(startDateStr?: string, endDateStr?: string) {
    const createdAt: { gte?: Date; lte?: Date } = {};

    if (startDateStr) {
      const start = new Date(startDateStr);
      if (!Number.isNaN(start.getTime())) {
        createdAt.gte = start;
      }
    }

    if (endDateStr) {
      const end = new Date(endDateStr);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
    }

    return Object.keys(createdAt).length > 0 ? createdAt : undefined;
  }

  private groupByDynamicRange(
    data: any[],
    startDate: Date,
    endDate: Date,
    valueSelector: (item: any) => number,
    valueKey: 'count' | 'revenue' = 'count',
  ) {
    const result: any[] = [];
    const durationMs = endDate.getTime() - startDate.getTime();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    let bucketMs = 30 * dayMs;
    let mode: 'hours' | 'days' | 'months' = 'months';

    if (durationMs <= dayMs) {
      bucketMs = 4 * hourMs;
      mode = 'hours';
    } else if (durationMs <= 31 * dayMs) {
      bucketMs = dayMs;
      mode = 'days';
    }

    if (mode === 'months') {
      const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      while (cursor <= last) {
        const bucketStart = new Date(cursor);
        const bucketEnd = new Date(
          cursor.getFullYear(),
          cursor.getMonth() + 1,
          1,
        );

        const bucketData = data.filter((item) => {
          const itemDate = new Date(item.createdAt);
          return itemDate >= bucketStart && itemDate < bucketEnd;
        });

        const value = bucketData.reduce(
          (sum, item) => sum + Number(valueSelector(item) || 0),
          0,
        );

        result.push({
          month: bucketStart.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          ...(valueKey === 'revenue'
            ? { revenue: value }
            : { count: value, amount: value }),
        });

        cursor.setMonth(cursor.getMonth() + 1);
      }

      return result;
    }

    let cursor = new Date(startDate);
    while (cursor <= endDate) {
      const bucketStart = new Date(cursor);
      const bucketEnd = new Date(cursor.getTime() + bucketMs);
      const bucketData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= bucketStart && itemDate < bucketEnd;
      });

      const value = bucketData.reduce(
        (sum, item) => sum + Number(valueSelector(item) || 0),
        0,
      );

      result.push({
        month:
          mode === 'hours'
            ? bucketStart.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
            : bucketStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
        ...(valueKey === 'revenue'
          ? { revenue: value }
          : { count: value, amount: value }),
      });

      cursor = bucketEnd;
    }

    return result;
  }

  private groupByMonthRange(data: any[], startDate: Date, endDate: Date) {
    const result: any[] = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (cursor <= last) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();

      const monthData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate.getFullYear() === year && itemDate.getMonth() === month;
      });

      result.push({
        month: cursor.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        count: monthData.length,
        amount: monthData.reduce(
          (sum, item) =>
            sum + Number(item.loanAmount || item.requestedAmount || 0),
          0,
        ),
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return result;
  }

  async getBorrowerAnalytics(user: any, startDate?: string, endDate?: string) {
    const borrowers = await this.prisma.borrower.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!borrowers.length) {
      return {
        totalLoans: 0,
        activeLoans: 0,
        totalBorrowed: 0,
        totalInterest: 0,
        totalAmountDue: 0,
        totalPaid: 0,
        pendingAmount: 0,
        overduePayments: 0,
      };
    }

    const borrowerIds = borrowers.map((b) => b.id);
    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);
    const dueDateFilter = this.buildCreatedAtFilter(startDate, endDate);

    const loanWhere: any = { borrowerId: { in: borrowerIds } };
    if (createdAtFilter) {
      loanWhere.createdAt = createdAtFilter;
    }

    const contractWhere: any = { loan: { borrowerId: { in: borrowerIds } } };
    if (createdAtFilter) {
      contractWhere.createdAt = createdAtFilter;
    }

    const paidWhere: any = {
      type: { in: ['INSTALLMENT_PAYMENT', 'PENALTY_PAYMENT'] },
      status: 'COMPLETED',
      contract: { loan: { borrowerId: { in: borrowerIds } } },
    };
    if (createdAtFilter) {
      paidWhere.createdAt = createdAtFilter;
    }

    const pendingSchedulesWhere: any = {
      status: 'PENDING',
      contract: { loan: { borrowerId: { in: borrowerIds } } },
    };
    if (dueDateFilter) {
      pendingSchedulesWhere.dueDate = dueDateFilter;
    }

    const overdueSchedulesWhere: any = {
      status: 'PENDING',
      dueDate: { lt: new Date() },
      contract: { loan: { borrowerId: { in: borrowerIds } } },
    };
    if (dueDateFilter?.gte) {
      overdueSchedulesWhere.dueDate.gte = dueDateFilter.gte;
    }
    if (dueDateFilter?.lte) {
      overdueSchedulesWhere.dueDate.lte = dueDateFilter.lte;
    }

    const [
      totalLoans,
      activeLoans,
      contracts,
      totalPaid,
      pendingSchedules,
      overdueSchedules,
    ] = await Promise.all([
      this.prisma.loan.count({
        where: loanWhere,
      }),
      this.prisma.loan.count({
        where: {
          ...loanWhere,
          status: { in: ['CONTRACT_SIGNED', 'LOAN_PROVIDED'] },
        },
      }),
      this.prisma.contract.findMany({
        where: contractWhere,
        select: { loanAmount: true, totalAmountDue: true },
      }),
      this.prisma.transaction.aggregate({
        where: paidWhere,
        _sum: { amount: true },
      }),
      this.prisma.paymentSchedule.aggregate({
        where: pendingSchedulesWhere,
        _sum: { totalAmount: true },
      }),
      this.prisma.paymentSchedule.count({
        where: overdueSchedulesWhere,
      }),
    ]);

    const totalBorrowed = contracts.reduce(
      (sum, contract) => sum + Number(contract.loanAmount),
      0,
    );
    const totalAmountDue = contracts.reduce(
      (sum, contract) => sum + Number(contract.totalAmountDue),
      0,
    );
    const totalInterest = Math.max(totalAmountDue - totalBorrowed, 0);
    const totalPaidAmount = Number(totalPaid._sum.amount || 0);
    const pendingWithInterest = Math.max(totalAmountDue - totalPaidAmount, 0);

    return {
      totalLoans,
      activeLoans,
      totalBorrowed,
      totalInterest,
      totalAmountDue,
      totalPaid: totalPaidAmount,
      pendingAmount: pendingWithInterest,
      overduePayments: overdueSchedules,
    };
  }

  async getMonthlyContracts(
    user: any,
    months: number = 12,
    startDate?: string,
    endDate?: string,
  ) {
    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);
    const rangeStart = createdAtFilter?.gte;
    const rangeEnd = createdAtFilter?.lte;
    const fallbackStart = new Date();
    fallbackStart.setMonth(fallbackStart.getMonth() - months);

    const whereClause: any = {
      createdAt: createdAtFilter || { gte: fallbackStart },
    };

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      whereClause.tenantId = user.tenantId;
    }

    const contracts = await this.prisma.contract.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        loanAmount: true,
        status: true,
      },
    });

    if (rangeStart && rangeEnd) {
      return this.groupByDynamicRange(contracts, rangeStart, rangeEnd, () => 1);
    }

    return this.groupByMonth(contracts, months);
  }

  async getMonthlyLoans(
    user: any,
    months: number = 12,
    startDate?: string,
    endDate?: string,
  ) {
    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);
    const rangeStart = createdAtFilter?.gte;
    const rangeEnd = createdAtFilter?.lte;
    const fallbackStart = new Date();
    fallbackStart.setMonth(fallbackStart.getMonth() - months);

    const whereClause: any = {
      createdAt: createdAtFilter || { gte: fallbackStart },
    };

    const normalizedRoles = (user.roles || []).map((role: string) =>
      role.toLowerCase(),
    );
    const isSuperAdmin = normalizedRoles.includes('super admin');
    const isBorrower = normalizedRoles.includes('borrower');

    if (isBorrower) {
      whereClause.borrower = { userId: user.id };
    } else if (!isSuperAdmin) {
      whereClause.tenantId = user.tenantId;
    }

    const loans = await this.prisma.loan.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        requestedAmount: true,
        status: true,
      },
    });

    if (rangeStart && rangeEnd) {
      return this.groupByDynamicRange(loans, rangeStart, rangeEnd, () => 1);
    }

    const monthlyData = this.groupByMonth(loans, months);
    return monthlyData;
  }

  async getLoansByStatus(user: any, startDate?: string, endDate?: string) {
    const whereClause: any = {};
    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);

    const normalizedRoles = (user.roles || []).map((role: string) =>
      role.toLowerCase(),
    );
    const isSuperAdmin = normalizedRoles.includes('super admin');
    const isBorrower = normalizedRoles.includes('borrower');

    if (isBorrower) {
      whereClause.borrower = { userId: user.id };
    } else if (!isSuperAdmin) {
      whereClause.tenantId = user.tenantId;
    }

    if (createdAtFilter) {
      whereClause.createdAt = createdAtFilter;
    }

    const loans = await this.prisma.loan.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    return loans.map((item) => ({
      status: item.status,
      count: item._count,
    }));
  }

  async getContractsByStatus(user: any, startDate?: string, endDate?: string) {
    const whereClause: any = {};
    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      whereClause.tenantId = user.tenantId;
    }

    if (createdAtFilter) {
      whereClause.createdAt = createdAtFilter;
    }

    const contracts = await this.prisma.contract.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    return contracts.map((item) => ({
      status: item.status,
      count: item._count,
    }));
  }

  async getMonthlyRevenue(
    user: any,
    months: number = 12,
    startDate?: string,
    endDate?: string,
  ) {
    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);
    const rangeStart = createdAtFilter?.gte;
    const rangeEnd = createdAtFilter?.lte;
    const fallbackStart = new Date();
    fallbackStart.setMonth(fallbackStart.getMonth() - months);

    const whereClause: any = {
      createdAt: createdAtFilter || { gte: fallbackStart },
      status: 'COMPLETED',
      type: { in: ['INSTALLMENT_PAYMENT', 'PENALTY_PAYMENT', 'FEE'] },
    };

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      whereClause.contract = { tenantId: user.tenantId };
    }

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        amount: true,
      },
    });

    if (rangeStart && rangeEnd) {
      return this.groupByDynamicRange(
        transactions,
        rangeStart,
        rangeEnd,
        (item) => Number(item.amount || 0),
        'revenue',
      );
    }

    return this.groupByMonthRevenue(transactions, months);
  }

  private groupByMonth(data: any[], months: number) {
    const result: any[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const monthData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return (
          itemDate.getFullYear() === date.getFullYear() &&
          itemDate.getMonth() === date.getMonth()
        );
      });

      result.push({
        month: date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        count: monthData.length,
        amount: monthData.reduce(
          (sum, item) =>
            sum + Number(item.loanAmount || item.requestedAmount || 0),
          0,
        ),
      });
    }

    return result;
  }

  private groupByMonthRevenue(data: any[], months: number) {
    const result: any[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const monthData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return (
          itemDate.getFullYear() === date.getFullYear() &&
          itemDate.getMonth() === date.getMonth()
        );
      });

      result.push({
        month: date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        revenue: monthData.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0,
        ),
      });
    }

    return result;
  }

  async getMonthlyUsers(
    user: any,
    months: number = 12,
    startDate?: string,
    endDate?: string,
  ) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);
    const rangeStart = createdAtFilter?.gte;
    const rangeEnd = createdAtFilter?.lte;
    const fallbackStart = new Date();
    fallbackStart.setMonth(fallbackStart.getMonth() - months);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: createdAtFilter?.gte || fallbackStart,
          ...(createdAtFilter?.lte ? { lte: createdAtFilter.lte } : {}),
        },
      },
      select: {
        createdAt: true,
      },
    });

    if (rangeStart && rangeEnd) {
      return this.groupByDynamicRange(users, rangeStart, rangeEnd, () => 1);
    }

    return this.groupByMonth(users, months);
  }

  async getUsersByRole(user: any, startDate?: string, endDate?: string) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);

    const users = await this.prisma.user.findMany({
      where: createdAtFilter ? { createdAt: createdAtFilter } : {},
      select: {
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const roleMap = new Map<string, number>();
    users.forEach((u) => {
      u.roles.forEach((r) => {
        const roleName = r.role?.name || 'Unknown';
        roleMap.set(roleName, (roleMap.get(roleName) || 0) + 1);
      });
    });

    return Array.from(roleMap.entries()).map(([role, count]) => ({
      role,
      count,
    }));
  }

  async getMonthlyBorrowers(
    user: any,
    months: number = 12,
    startDate?: string,
    endDate?: string,
  ) {
    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);
    const rangeStart = createdAtFilter?.gte;
    const rangeEnd = createdAtFilter?.lte;
    const fallbackStart = new Date();
    fallbackStart.setMonth(fallbackStart.getMonth() - months);

    const whereClause: any = {
      createdAt: createdAtFilter || { gte: fallbackStart },
    };

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      whereClause.tenantId = user.tenantId;
    }

    const borrowers = await this.prisma.borrower.findMany({
      where: whereClause,
      select: {
        createdAt: true,
      },
    });

    if (rangeStart && rangeEnd) {
      return this.groupByDynamicRange(borrowers, rangeStart, rangeEnd, () => 1);
    }

    return this.groupByMonth(borrowers, months);
  }

  async getBorrowerMonthlyLoans(
    user: any,
    months: number = 12,
    startDate?: string,
    endDate?: string,
  ) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);
    const rangeStart = createdAtFilter?.gte;
    const rangeEnd = createdAtFilter?.lte;
    const fallbackStart = new Date();
    fallbackStart.setMonth(fallbackStart.getMonth() - months);

    const borrowers = await this.prisma.borrower.findMany({
      where: {
        createdAt: {
          gte: createdAtFilter?.gte || fallbackStart,
          ...(createdAtFilter?.lte ? { lte: createdAtFilter.lte } : {}),
        },
      },
      select: {
        createdAt: true,
      },
    });

    if (rangeStart && rangeEnd) {
      return this.groupByDynamicRange(borrowers, rangeStart, rangeEnd, () => 1);
    }

    return this.groupByMonth(borrowers, months);
  }

  async getBorrowersByStatus(user: any, startDate?: string, endDate?: string) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const createdAtFilter = this.buildCreatedAtFilter(startDate, endDate);

    const kycStatusCounts = await this.prisma.kyc.groupBy({
      by: ['status'],
      where: createdAtFilter ? { createdAt: createdAtFilter } : undefined,
      _count: {
        id: true,
      },
    });

    return kycStatusCounts.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));
  }
}
