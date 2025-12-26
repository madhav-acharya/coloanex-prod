import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
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
      if (!user.tenantId) {
        throw new BadRequestException('User must have a tenant ID');
      }
      tenantId = user.tenantId;
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
      providedLoanAmount: createLoanDto.providedLoanAmount,
      expectedLoanAmount: createLoanDto.expectedLoanAmount,
      loanPurpose: createLoanDto.loanPurpose,
      collateralType: createLoanDto.collateralType,
      collateralDescription: createLoanDto.collateralDescription,
      collateralValue: createLoanDto.collateralValue,
      collateralImageUrl: createLoanDto.collateralImageUrl,
      amount: createLoanDto.amount,
      interestRate: createLoanDto.interestRate,
      termMonths: createLoanDto.termMonths,
      status: LoanStatus.DRAFT,
    };

    const loan = await this.prisma.loan.create({
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
      ActivityAction.CREATE,
      ActivityEntityType.KYC,
      loan.id,
      'Loan application submitted',
      null,
      { amount: loan.amount, termMonths: loan.termMonths },
      ipAddress,
      userAgent,
      tenantId,
    );

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
    if (updateLoanDto.amount !== undefined)
      loanData.amount = updateLoanDto.amount;
    if (updateLoanDto.interestRate !== undefined)
      loanData.interestRate = updateLoanDto.interestRate;
    if (updateLoanDto.termMonths !== undefined)
      loanData.termMonths = updateLoanDto.termMonths;
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

    const updated = await this.prisma.loan.update({
      where: { id },
      data: {
        status: reviewLoanDto.status,
      },
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

    const action =
      reviewLoanDto.status === LoanStatus.APPROVED
        ? ActivityAction.UPDATE
        : ActivityAction.UPDATE;

    await this.activityLogsService.logUserActivity(
      user.sub,
      action,
      ActivityEntityType.KYC,
      id,
      `Loan ${reviewLoanDto.status.toLowerCase()}`,
      { status: loan.status },
      { status: reviewLoanDto.status, reason: reviewLoanDto.rejectionReason },
      ipAddress,
      userAgent,
      user.tenantId,
    );

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
}
