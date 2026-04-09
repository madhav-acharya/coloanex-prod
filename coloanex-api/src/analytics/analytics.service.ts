import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

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

  async getTenantAnalytics(user: any, tenantId?: string) {
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
    ] = await Promise.all([
      this.prisma.borrower.count({ where: borrowerWhere }),
      this.prisma.loan.count({ where: loanWhere }),
      this.prisma.loan.count({
        where: { ...loanWhere, status: 'APPROVED' },
      }),
      this.prisma.contract.count({ where: contractWhere }),
      this.prisma.contract.count({
        where: { ...contractWhere, status: 'ACTIVE' },
      }),
      this.prisma.kyc.count({
        where: { ...kycWhere, status: 'PENDING' },
      }),
      this.prisma.kyc.count({
        where: { ...kycWhere, status: 'VERIFIED' },
      }),
      this.prisma.contract.aggregate({
        where: contractWhere,
        _sum: { loanAmount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...transactionContractWhere,
          type: { in: ['INSTALLMENT_PAYMENT', 'PENALTY_PAYMENT'] },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.paymentSchedule.aggregate({
        where: {
          ...scheduleContractWhere,
          status: 'PENDING',
        },
        _sum: { totalAmount: true },
      }),
    ]);

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
    };
  }

  async getBorrowerAnalytics(user: any) {
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

    const [
      totalLoans,
      activeLoans,
      contracts,
      totalPaid,
      pendingSchedules,
      overdueSchedules,
    ] = await Promise.all([
      this.prisma.loan.count({
        where: { borrowerId: { in: borrowerIds } },
      }),
      this.prisma.loan.count({
        where: {
          borrowerId: { in: borrowerIds },
          status: { in: ['CONTRACT_SIGNED', 'LOAN_PROVIDED'] },
        },
      }),
      this.prisma.contract.findMany({
        where: { loan: { borrowerId: { in: borrowerIds } } },
        select: { loanAmount: true, totalAmountDue: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          type: { in: ['INSTALLMENT_PAYMENT', 'PENALTY_PAYMENT'] },
          status: 'COMPLETED',
          contract: { loan: { borrowerId: { in: borrowerIds } } },
        },
        _sum: { amount: true },
      }),
      this.prisma.paymentSchedule.aggregate({
        where: {
          status: 'PENDING',
          contract: { loan: { borrowerId: { in: borrowerIds } } },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.paymentSchedule.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: new Date() },
          contract: { loan: { borrowerId: { in: borrowerIds } } },
        },
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

  async getMonthlyContracts(user: any, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const whereClause: any = {
      createdAt: { gte: startDate },
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

    const monthlyData = this.groupByMonth(contracts, months);
    return monthlyData;
  }

  async getMonthlyLoans(user: any, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const whereClause: any = {
      createdAt: { gte: startDate },
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

    const monthlyData = this.groupByMonth(loans, months);
    return monthlyData;
  }

  async getLoansByStatus(user: any) {
    const whereClause: any = {};

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

  async getContractsByStatus(user: any) {
    const whereClause: any = {};

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      whereClause.tenantId = user.tenantId;
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

  async getMonthlyRevenue(user: any, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const whereClause: any = {
      createdAt: { gte: startDate },
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

    const monthlyData = this.groupByMonthRevenue(transactions, months);
    return monthlyData;
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

  async getMonthlyUsers(user: any, months: number = 12) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    return this.groupByMonth(users, months);
  }

  async getUsersByRole(user: any) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const userRoles = await this.prisma.userRole.groupBy({
      by: ['roleId'],
      _count: {
        userId: true,
      },
    });

    const rolesData = await Promise.all(
      userRoles.map(async (ur) => {
        const role = await this.prisma.role.findUnique({
          where: { id: ur.roleId },
          select: { name: true },
        });
        return {
          role: role?.name || 'Unknown',
          count: ur._count.userId,
        };
      }),
    );

    return rolesData;
  }

  async getMonthlyBorrowers(user: any, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const whereClause: any = {
      createdAt: { gte: startDate },
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

    return this.groupByMonth(borrowers, months);
  }

  async getBorrowerMonthlyLoans(user: any, months: number = 12) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const borrowers = await this.prisma.borrower.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    return this.groupByMonth(borrowers, months);
  }

  async getBorrowersByStatus(user: any) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const kycStatusCounts = await this.prisma.kyc.groupBy({
      by: ['status'],
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
