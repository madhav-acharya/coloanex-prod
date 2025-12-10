import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Borrower, KycStatus } from './entities/borrower.entity';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  ActivityEntityType,
  ActivityAction,
} from '../activity-logs/entities/activity-log.entity';

@Injectable()
export class BorrowersService {
  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(data: {
    tenantId: string;
    userId: string;
    actorUserId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<Borrower> {
    const borrower = await this.prisma.borrower.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        kycStatus: KycStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.activityLogsService.logUserActivity(
      data.actorUserId || data.userId,
      ActivityAction.CREATE,
      ActivityEntityType.BORROWER,
      borrower.id,
      'Borrower profile created',
      null,
      { tenantId: data.tenantId, userId: data.userId },
      data.ipAddress,
      data.userAgent,
      data.tenantId,
    );

    return borrower as Borrower;
  }

  async findByUserId(
    userId: string,
    tenantId: string,
  ): Promise<Borrower | null> {
    const result = await this.prisma.borrower.findFirst({
      where: {
        userId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        kycs: true,
      },
    });

    if (!result) return null;
    return {
      ...result,
      kycStatus: result.kycStatus as KycStatus,
    } as Borrower;
  }

  async findByTenant(tenantId: string, kycStatus?: KycStatus) {
    return this.prisma.borrower.findMany({
      where: {
        tenantId,
        ...(kycStatus && { kycStatus }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        kycs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateKycStatus(
    borrowerId: string,
    kycStatus: KycStatus,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const borrower = await this.prisma.borrower.findUnique({
      where: { id: borrowerId },
    });

    if (!borrower) {
      throw new Error('Borrower not found');
    }

    const updatedBorrower = await this.prisma.borrower.update({
      where: { id: borrowerId },
      data: {
        kycStatus,
        kycLastCheckedAt: new Date(),
      },
    });

    const action =
      kycStatus === KycStatus.VERIFIED
        ? ActivityAction.KYC_VERIFY
        : ActivityAction.KYC_REJECT;

    await this.activityLogsService.logUserActivity(
      actorUserId,
      action,
      ActivityEntityType.BORROWER,
      borrowerId,
      `KYC status updated to ${kycStatus}`,
      { kycStatus: borrower.kycStatus },
      { kycStatus },
      ipAddress,
      userAgent,
      borrower.tenantId,
    );

    return updatedBorrower;
  }

  async ensureBorrowerExists(
    userId: string,
    tenantId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Borrower> {
    const existing: Borrower | null = await this.findByUserId(userId, tenantId);
    if (existing) {
      return existing;
    }

    return this.create({
      tenantId,
      userId,
      actorUserId,
      ipAddress,
      userAgent,
    });
  }
}
