import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { MailService } from '../mail/mail.service';
import { ContractsService } from '../contracts/contracts.service';
import { loanRequestTemplate, loanApprovalTemplate } from '../mail/templates';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ReviewLoanDto } from './dto/review-loan.dto';
import type { Loan } from './entities/loan.entity';
import { LoanStatus } from './entities/loan.entity';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import type { LoanQueryInterface } from './interfaces/loan-query.interface';
import {
  ActivityEntityType,
  ActivityAction,
} from '../activity-logs/entities/activity-log.entity';

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
    private mailService: MailService,
    private contractsService: ContractsService,
  ) {}

  private isSuperAdmin(user: JwtPayload): boolean {
    return user.roles.includes('Super Admin');
  }

  private isBorrower(user: JwtPayload): boolean {
    return user.roles.includes('Borrower');
  }

  private isLender(user: JwtPayload): boolean {
    return user.roles.includes('Lender');
  }

  async checkExistingLoan(
    tenantId: string,
    user: JwtPayload,
  ): Promise<{ hasLoan: boolean; loanId?: string; status?: string }> {
    if (!this.isBorrower(user)) {
      throw new BadRequestException(
        'Only borrowers can check for existing loans',
      );
    }

    const borrower = await this.prisma.borrower.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.sub,
        },
      },
      include: {
        loans: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!borrower || borrower.loans.length === 0) {
      return { hasLoan: false };
    }

    const loan = borrower.loans[0];
    return {
      hasLoan: true,
      loanId: loan.id,
      status: loan.status,
    };
  }

  async getMyLoans(user: JwtPayload): Promise<Loan[]> {
    if (!this.isBorrower(user)) {
      throw new BadRequestException('Only borrowers can view their loans');
    }

    const loans = await this.prisma.loan.findMany({
      where: {
        borrower: {
          userId: user.sub,
        },
      },
      include: {
        borrower: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return loans as unknown as Loan[];
  }

  async create(
    createLoanDto: CreateLoanDto,
    user: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Loan> {
    let tenantId: string;
    let targetUserId: string;

    if (this.isSuperAdmin(user)) {
      if (!createLoanDto.tenantId) {
        throw new BadRequestException(
          'Super Admin must provide tenant ID when creating loan',
        );
      }
      tenantId = createLoanDto.tenantId;
      if (!createLoanDto.userId) {
        throw new BadRequestException(
          'Super Admin must provide user ID when creating loan',
        );
      }
      targetUserId = createLoanDto.userId;
    } else if (this.isLender(user)) {
      if (!user.tenantId) {
        throw new BadRequestException('Lender must have a tenant ID');
      }
      tenantId = user.tenantId;
      if (!createLoanDto.userId) {
        throw new BadRequestException(
          'Lender must provide user ID when creating loan',
        );
      }
      targetUserId = createLoanDto.userId;
    } else if (this.isBorrower(user)) {
      if (!createLoanDto.tenantId) {
        throw new BadRequestException(
          'Borrower must provide tenant ID when applying for loan',
        );
      }
      tenantId = createLoanDto.tenantId;
      targetUserId = user.sub;
    } else {
      if (!user.tenantId) {
        throw new BadRequestException('User must have a tenant ID');
      }
      tenantId = user.tenantId;
      if (!createLoanDto.userId) {
        throw new BadRequestException(
          'Tenant user must provide user ID when creating loan',
        );
      }
      targetUserId = createLoanDto.userId;
    }

    let borrower = await this.prisma.borrower.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: targetUserId,
        },
      },
    });

    if (!borrower) {
      throw new BadRequestException(
        'Borrower not found. User must be registered as a borrower first.',
      );
    }

    const loanData = {
      tenantId,
      borrowerId: borrower.id,
      requestedAmount: createLoanDto.requestedAmount,
      purpose: createLoanDto.purpose,
      requestedTermMonths: createLoanDto.requestedTermMonths,
      collateralDetails: createLoanDto.collateralDetails,
      status: LoanStatus.DRAFT,
    };

    const loan = await this.prisma.loan.create({
      data: loanData as any,
      include: {
        borrower: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.CREATE,
      ActivityEntityType.KYC,
      loan.id,
      'Loan application submitted',
      null,
      {
        requestedAmount: loan.requestedAmount.toString(),
        requestedTermMonths: loan.requestedTermMonths,
      },
      ipAddress,
      userAgent,
      tenantId,
    );

    if (loan.status === LoanStatus.SUBMITTED) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      try {
        const dashboardUrl =
          process.env.APP_URL || 'https://app.example.com/loans';

        await this.mailService.sendMail(
          {
            to: loan.borrower.user.email,
            subject: `Loan Application Submitted - ${tenant?.name || 'CoLoanEx'}`,
            html: loanRequestTemplate({
              tenantName: tenant?.name || 'CoLoanEx',
              tenantLogo: tenant?.logo || undefined,
              userName: loan.borrower.user.fullName,
              status: 'SUBMITTED',
              loanAmount: `$${loan.requestedAmount.toLocaleString()}`,
              loanPurpose: loan.purpose || undefined,
              loanId: loan.id,
              applicationDate: new Date(loan.createdAt).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              ),
              dashboardUrl,
              supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
              tenantPrimaryColor: tenant?.primaryColor || undefined,
              tenantWebsite: tenant?.website || undefined,
              nextSteps:
                'Your loan application is being reviewed. We will notify you once the review is complete.',
            }),
          },
          tenantId,
        );
      } catch (error) {
        console.error('Failed to send loan submission email:', error);
      }
    }

    return loan as unknown as Loan;
  }

  async findAll(query: LoanQueryInterface, user: JwtPayload) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (this.isSuperAdmin(user)) {
      if (query.tenantId) {
        where.tenantId = query.tenantId;
      }
    } else if (this.isLender(user)) {
      where.tenantId = user.tenantId;
    } else if (this.isBorrower(user)) {
      where.borrower = {
        tenantId: user.tenantId,
        userId: user.sub,
      };
    } else {
      if (query.tenantId) {
        where.tenantId = query.tenantId;
      } else if (user.tenantId) {
        where.tenantId = user.tenantId;
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.borrower = {
        ...(where.borrower as Record<string, unknown>),
        user: {
          OR: [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const orderBy: Record<string, string> = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          borrower: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.loan.count({ where }),
    ]);

    return {
      data: loans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string, user?: JwtPayload): Promise<Loan> {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        borrower: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (user && this.isBorrower(user)) {
      if (loan.borrower.userId !== user.sub) {
        throw new NotFoundException('Loan not found');
      }
    } else if (user && !this.isSuperAdmin(user)) {
      if (loan.tenantId !== user.tenantId) {
        throw new NotFoundException('Loan not found');
      }
    }

    return loan as unknown as Loan;
  }

  async update(
    id: string,
    updateLoanDto: UpdateLoanDto,
    user: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Loan> {
    const existing = await this.findOne(id, user);

    if (!existing.borrower) {
      throw new NotFoundException('Borrower not found for this loan');
    }

    let tenantId: string;
    let targetUserId: string;
    let shouldUpdateBorrower = false;

    if (this.isSuperAdmin(user)) {
      if (updateLoanDto.tenantId && updateLoanDto.userId) {
        tenantId = updateLoanDto.tenantId;
        targetUserId = updateLoanDto.userId;
        shouldUpdateBorrower =
          existing.tenantId !== tenantId ||
          existing.borrower.userId !== targetUserId;
      } else {
        tenantId = existing.tenantId;
        targetUserId = existing.borrower.userId;
      }
    } else if (this.isLender(user)) {
      if (!user.tenantId) {
        throw new BadRequestException('Lender must have a tenant ID');
      }
      tenantId = user.tenantId;
      if (updateLoanDto.userId) {
        targetUserId = updateLoanDto.userId;
        shouldUpdateBorrower = existing.borrower.userId !== targetUserId;
      } else {
        targetUserId = existing.borrower.userId;
      }
    } else if (this.isBorrower(user)) {
      if (existing.borrower.userId !== user.sub) {
        throw new BadRequestException(
          'You can only update your own loan applications',
        );
      }
      tenantId = existing.tenantId;
      targetUserId = user.sub;
    } else {
      if (!user.tenantId) {
        throw new BadRequestException('User must have a tenant ID');
      }
      tenantId = user.tenantId;
      if (updateLoanDto.userId) {
        targetUserId = updateLoanDto.userId;
        shouldUpdateBorrower = existing.borrower.userId !== targetUserId;
      } else {
        targetUserId = existing.borrower.userId;
      }
    }

    let borrowerId = existing.borrower.id;

    if (shouldUpdateBorrower) {
      const borrower = await this.prisma.borrower.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: targetUserId,
          },
        },
      });

      if (!borrower) {
        throw new BadRequestException(
          'Borrower not found. User must be registered as a borrower first.',
        );
      }

      borrowerId = borrower.id;
    }

    const loanData: any = {};
    if (updateLoanDto.requestedAmount !== undefined)
      loanData.requestedAmount = updateLoanDto.requestedAmount;
    if (updateLoanDto.purpose !== undefined)
      loanData.purpose = updateLoanDto.purpose;
    if (updateLoanDto.collateralDetails !== undefined)
      loanData.collateralDetails = updateLoanDto.collateralDetails as any;
    if (updateLoanDto.requestedTermMonths !== undefined)
      loanData.requestedTermMonths = updateLoanDto.requestedTermMonths;
    if (shouldUpdateBorrower) {
      loanData.tenantId = tenantId;
      loanData.borrowerId = borrowerId;
    }

    const updated = await this.prisma.loan.update({
      where: { id },
      data: loanData,
      include: {
        borrower: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.UPDATE,
      ActivityEntityType.KYC,
      id,
      'Loan updated',
      existing,
      updated,
      ipAddress,
      userAgent,
      user.tenantId,
    );

    return updated as unknown as Loan;
  }

  async review(
    id: string,
    reviewLoanDto: ReviewLoanDto,
    user: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Loan> {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        borrower: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (
      reviewLoanDto.status === LoanStatus.REJECTED &&
      !reviewLoanDto.rejectionReason
    ) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting loan',
      );
    }

    if (reviewLoanDto.status === LoanStatus.APPROVED) {
      if (!reviewLoanDto.ruleId) {
        throw new BadRequestException('Rule is required when approving loan');
      }
      if (!reviewLoanDto.approvedAmount) {
        throw new BadRequestException(
          'Approved amount is required when approving loan',
        );
      }
      if (!reviewLoanDto.approvedTermMonths) {
        throw new BadRequestException(
          'Approved term is required when approving loan',
        );
      }
    }

    const updateData: any = {
      status: reviewLoanDto.status,
      rejectionReason: reviewLoanDto.rejectionReason,
    };

    if (reviewLoanDto.status === LoanStatus.APPROVED) {
      updateData.approvedAmount = reviewLoanDto.approvedAmount;
      updateData.approvedTermMonths = reviewLoanDto.approvedTermMonths;
      updateData.ruleId = reviewLoanDto.ruleId;
    }

    const updated = await this.prisma.loan.update({
      where: { id },
      data: updateData,
      include: {
        borrower: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (reviewLoanDto.status === LoanStatus.APPROVED) {
      try {
        await this.contractsService.generateFromLoanApproval(
          id,
          reviewLoanDto.ruleId!,
          reviewLoanDto.approvedAmount!,
          reviewLoanDto.approvedTermMonths!,
          user.tenantId!,
        );
      } catch (error) {
        console.error('Failed to generate contract:', error);
      }
    }

    const action =
      reviewLoanDto.status === LoanStatus.APPROVED
        ? ActivityAction.LOAN_APPROVE
        : reviewLoanDto.status === LoanStatus.REJECTED
          ? ActivityAction.LOAN_REJECT
          : ActivityAction.UPDATE;

    await this.activityLogsService.logUserActivity(
      user.sub,
      action,
      ActivityEntityType.LOAN,
      id,
      `Loan ${reviewLoanDto.status === LoanStatus.APPROVED ? 'approved and contract created' : reviewLoanDto.status.toLowerCase()}`,
      { status: loan.status },
      { status: updated.status, reason: reviewLoanDto.rejectionReason },
      ipAddress,
      userAgent,
      user.tenantId,
    );

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: updated.tenantId },
    });

    const statusMap = {
      [LoanStatus.SUBMITTED]: 'SUBMITTED' as const,
      [LoanStatus.UNDER_REVIEW]: 'UNDER_REVIEW' as const,
      [LoanStatus.APPROVED]: 'APPROVED' as const,
      [LoanStatus.REJECTED]: 'REJECTED' as const,
      [LoanStatus.DRAFT]: 'SUBMITTED' as const,
      [LoanStatus.CONTRACT_GENERATED]: 'APPROVED' as const,
      [LoanStatus.CONTRACT_SIGNED]: 'APPROVED' as const,
      [LoanStatus.LOAN_PROVIDED]: 'APPROVED' as const,
    };

    try {
      if (reviewLoanDto.status === LoanStatus.APPROVED) {
        // Dedicated approval email
        await this.mailService.sendMail(
          {
            to: updated.borrower.user.email,
            subject: `Your Loan Has Been Approved – ${tenant?.name || 'CoLoanEx'}`,
            html: loanApprovalTemplate({
              tenantName: tenant?.name || 'CoLoanEx',
              tenantLogo: tenant?.logo || undefined,
              userName: updated.borrower.user.fullName,
              approvedAmount: `$${updated.approvedAmount?.toLocaleString() || updated.requestedAmount.toLocaleString()}`,
              requestedAmount: `$${updated.requestedAmount.toLocaleString()}`,
              interestRate: 'Per agreed terms',
              termMonths:
                updated.approvedTermMonths ||
                reviewLoanDto.approvedTermMonths ||
                0,
              loanPurpose: updated.purpose || undefined,
              loanId: updated.id,
              approvalDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              contractUrl: `${process.env.APP_URL || 'https://app.example.com'}/contracts`,
              supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
              tenantPrimaryColor: tenant?.primaryColor || undefined,
              tenantWebsite: tenant?.website || undefined,
            }),
          },
          updated.tenantId,
        );
      } else {
        const dashboardUrl =
          process.env.APP_URL || 'https://app.example.com/loans';

        await this.mailService.sendMail(
          {
            to: updated.borrower.user.email,
            subject: `Loan Application ${reviewLoanDto.status === LoanStatus.REJECTED ? 'Status Update' : 'Update'} - ${tenant?.name || 'CoLoanEx'}`,
            html: loanRequestTemplate({
              tenantName: tenant?.name || 'CoLoanEx',
              tenantLogo: tenant?.logo || undefined,
              userName: updated.borrower.user.fullName,
              status: statusMap[updated.status] || 'UNDER_REVIEW',
              loanAmount: `$${updated.requestedAmount.toLocaleString()}`,
              loanPurpose: updated.purpose || undefined,
              loanId: updated.id,
              applicationDate: new Date(updated.createdAt).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              ),
              reviewedDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              rejectionReason: reviewLoanDto.rejectionReason || undefined,
              dashboardUrl,
              supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
              tenantPrimaryColor: tenant?.primaryColor || undefined,
              tenantWebsite: tenant?.website || undefined,
              nextSteps:
                reviewLoanDto.status === LoanStatus.REJECTED
                  ? 'Please review the reason provided. You may reapply after addressing the concerns.'
                  : 'Your application is being reviewed. We will notify you of any updates.',
            }),
          },
          updated.tenantId,
        );
      }
    } catch (error) {
      console.error('Failed to send loan status email:', error);
    }

    return updated as unknown as Loan;
  }

  async remove(
    id: string,
    user: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const loan = await this.findOne(id);

    await this.prisma.loan.delete({
      where: { id },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.DELETE,
      ActivityEntityType.KYC,
      id,
      'Loan deleted',
      loan,
      null,
      ipAddress,
      userAgent,
      user.tenantId,
    );
  }

  async getPaymentSchedule(id: string, user: JwtPayload): Promise<any[]> {
    const loan = await this.findOne(id, user);
    return [];
  }

  async makePayment(
    id: string,
    amount: number,
    user: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
    paymentMethodId?: string,
  ): Promise<any> {
    const loan = await this.findOne(id, user);

    if (!this.isBorrower(user) || loan.borrower?.userId !== user.sub) {
      throw new BadRequestException(
        'You can only make payments on your own loans',
      );
    }

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.CREATE,
      ActivityEntityType.KYC,
      id,
      `Payment of ${amount} made`,
      null,
      { amount, paymentMethodId },
      ipAddress,
      userAgent,
      loan.tenantId,
    );

    return {
      success: true,
      message: 'Payment processed successfully',
      amount,
    };
  }

  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    months: number,
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment * 100) / 100;
  }
}
