import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import type { Kyc } from './entities/kyc.entity';
import { KycStatus } from './entities/kyc.entity';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import type { KycQueryInterface } from './interfaces/kyc-query.interface';
import {
  ActivityEntityType,
  ActivityAction,
} from '../activity-logs/entities/activity-log.entity';

@Injectable()
export class KycService {
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
    createKycDto: CreateKycDto,
    user: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Kyc> {
    let tenantId: string;
    let targetUserId: string;

    if (this.isSuperAdmin(user)) {
      if (!createKycDto.tenantId) {
        throw new BadRequestException(
          'Super Admin must provide tenant ID when creating KYC',
        );
      }
      tenantId = createKycDto.tenantId;
      if (!createKycDto.userId) {
        throw new BadRequestException(
          'Super Admin must provide user ID when creating KYC',
        );
      }
      targetUserId = createKycDto.userId;
    } else if (this.isLender(user)) {
      if (!user.tenantId) {
        throw new BadRequestException('Lender must have a tenant ID');
      }
      tenantId = user.tenantId;
      if (!createKycDto.userId) {
        throw new BadRequestException(
          'Lender must provide user ID when creating KYC',
        );
      }
      targetUserId = createKycDto.userId;
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
      if (!createKycDto.userId) {
        throw new BadRequestException(
          'Tenant user must provide user ID when creating KYC',
        );
      }
      targetUserId = createKycDto.userId;
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
      borrower = await this.prisma.borrower.create({
        data: {
          tenantId,
          userId: targetUserId,
          kycStatus: KycStatus.PENDING,
        },
      });
    }

    const { files, ...kycData } = createKycDto;
    delete (kycData as any).tenantId;
    delete (kycData as any).borrowerId;
    delete (kycData as any).userId;

    const kyc = await this.prisma.kyc.create({
      data: {
        ...kycData,
        borrowerId: borrower.id,
        dateOfBirth: new Date(kycData.dateOfBirth),
        files: files
          ? {
              create: files.map((file) => ({
                fileType: file.fileType,
                documentNumber: file.documentNumber || '',
                issueDate: file.issueDate
                  ? new Date(file.issueDate)
                  : undefined,
                expiryDate: file.expiryDate
                  ? new Date(file.expiryDate)
                  : undefined,
                issueDistrict: file.issueDistrict,
                documentType: file.documentType || '',
                fileUrl: file.fileUrl,
                fileName: file.fileName,
                mimeType: file.mimeType,
                sizeInBytes: file.sizeInBytes,
              })),
            }
          : undefined,
      },
      include: {
        files: true,
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

    await this.prisma.borrower.update({
      where: { id: borrower.id },
      data: { kycStatus: KycStatus.PENDING },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.CREATE,
      ActivityEntityType.KYC,
      kyc.id,
      'KYC application submitted',
      null,
      { firstName: kyc.firstName, lastName: kyc.lastName },
      ipAddress,
      userAgent,
      tenantId,
    );

    return kyc as unknown as Kyc;
  }

  async findAll(query: KycQueryInterface, user: JwtPayload) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (this.isSuperAdmin(user)) {
      if (query.tenantId) {
        where.borrower = { tenantId: query.tenantId };
      }
    } else if (this.isLender(user)) {
      where.borrower = { tenantId: user.tenantId };
    } else if (this.isBorrower(user)) {
      where.borrower = {
        tenantId: user.tenantId,
        userId: user.sub,
      };
    } else {
      if (query.tenantId) {
        where.borrower = { tenantId: query.tenantId };
      } else if (user.tenantId) {
        where.borrower = { tenantId: user.tenantId };
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [kycs, total] = await Promise.all([
      this.prisma.kyc.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          files: true,
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
      this.prisma.kyc.count({ where }),
    ]);

    return {
      data: kycs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string, user?: JwtPayload): Promise<Kyc> {
    const kyc = await this.prisma.kyc.findUnique({
      where: { id },
      include: {
        files: true,
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

    if (!kyc) {
      throw new NotFoundException('KYC not found');
    }

    if (user && this.isBorrower(user)) {
      if (kyc.borrower.userId !== user.sub) {
        throw new NotFoundException('KYC not found');
      }
    } else if (user && !this.isSuperAdmin(user)) {
      if (kyc.borrower.tenantId !== user.tenantId) {
        throw new NotFoundException('KYC not found');
      }
    }

    return kyc as unknown as Kyc;
  }

  async update(
    id: string,
    updateKycDto: UpdateKycDto,
    user: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Kyc> {
    const existing = await this.findOne(id, user);

    if (!existing.borrower) {
      throw new NotFoundException('Borrower not found for this KYC');
    }

    let tenantId: string;
    let targetUserId: string;
    let shouldUpdateBorrower = false;

    if (this.isSuperAdmin(user)) {
      if (updateKycDto.tenantId && updateKycDto.userId) {
        tenantId = updateKycDto.tenantId;
        targetUserId = updateKycDto.userId;
        shouldUpdateBorrower =
          existing.borrower.tenantId !== tenantId ||
          existing.borrower.userId !== targetUserId;
      } else {
        tenantId = existing.borrower.tenantId;
        targetUserId = existing.borrower.userId;
      }
    } else if (this.isLender(user)) {
      if (!user.tenantId) {
        throw new BadRequestException('Lender must have a tenant ID');
      }
      tenantId = user.tenantId;
      if (updateKycDto.userId) {
        targetUserId = updateKycDto.userId;
        shouldUpdateBorrower = existing.borrower.userId !== targetUserId;
      } else {
        targetUserId = existing.borrower.userId;
      }
    } else if (this.isBorrower(user)) {
      if (existing.borrower.userId !== user.sub) {
        throw new BadRequestException(
          'You can only update your own KYC documents',
        );
      }
      tenantId = existing.borrower.tenantId;
      targetUserId = user.sub;
    } else {
      if (!user.tenantId) {
        throw new BadRequestException('User must have a tenant ID');
      }
      tenantId = user.tenantId;
      if (updateKycDto.userId) {
        targetUserId = updateKycDto.userId;
        shouldUpdateBorrower = existing.borrower.userId !== targetUserId;
      } else {
        targetUserId = existing.borrower.userId;
      }
    }

    let borrowerId = existing.borrower.id;

    if (shouldUpdateBorrower) {
      let borrower = await this.prisma.borrower.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: targetUserId,
          },
        },
      });

      if (!borrower) {
        borrower = await this.prisma.borrower.create({
          data: {
            tenantId,
            userId: targetUserId,
            kycStatus: KycStatus.PENDING,
          },
        });
      }

      borrowerId = borrower.id;
    }

    const { files, ...kycData } = updateKycDto;
    delete (kycData as any).tenantId;
    delete (kycData as any).borrowerId;
    delete (kycData as any).userId;

    const updated = await this.prisma.kyc.update({
      where: { id },
      data: {
        ...kycData,
        borrowerId,
        dateOfBirth: kycData.dateOfBirth
          ? new Date(kycData.dateOfBirth)
          : undefined,
      },
      include: {
        files: true,
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

    if (files) {
      await this.prisma.kycFile.deleteMany({
        where: { kycId: id },
      });

      await this.prisma.kycFile.createMany({
        data: files.map((file) => ({
          kycId: id,
          fileType: file.fileType,
          documentNumber: file.documentNumber || '',
          issueDate: file.issueDate ? new Date(file.issueDate) : undefined,
          expiryDate: file.expiryDate ? new Date(file.expiryDate) : undefined,
          issueDistrict: file.issueDistrict,
          documentType: file.documentType || '',
          fileUrl: file.fileUrl,
          fileName: file.fileName,
          mimeType: file.mimeType,
          sizeInBytes: file.sizeInBytes,
        })),
      });
    }

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.UPDATE,
      ActivityEntityType.KYC,
      id,
      'KYC updated',
      existing,
      updated,
      ipAddress,
      userAgent,
      user.tenantId,
    );

    return this.findOne(id);
  }

  async verify(
    id: string,
    verifyKycDto: VerifyKycDto,
    user: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Kyc> {
    const kyc = await this.prisma.kyc.findUnique({
      where: { id },
      include: {
        borrower: true,
      },
    });

    if (!kyc) {
      throw new NotFoundException('KYC not found');
    }

    if (
      verifyKycDto.status === KycStatus.REJECTED &&
      !verifyKycDto.rejectionReason
    ) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting KYC',
      );
    }

    const updated = await this.prisma.kyc.update({
      where: { id },
      data: {
        status: verifyKycDto.status,
        rejectionReason: verifyKycDto.rejectionReason,
        notes: verifyKycDto.notes,
        verifiedBy: user.sub,
        verifiedAt: new Date(),
      },
      include: {
        files: true,
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

    await this.prisma.borrower.update({
      where: { id: kyc.borrower.id },
      data: { kycStatus: verifyKycDto.status },
    });

    const action =
      verifyKycDto.status === KycStatus.VERIFIED
        ? ActivityAction.KYC_VERIFY
        : ActivityAction.KYC_REJECT;

    await this.activityLogsService.logUserActivity(
      user.sub,
      action,
      ActivityEntityType.KYC,
      id,
      `KYC ${verifyKycDto.status.toLowerCase()}`,
      { status: kyc.status },
      { status: verifyKycDto.status, reason: verifyKycDto.rejectionReason },
      ipAddress,
      userAgent,
      user.tenantId,
    );

    return updated as unknown as Kyc;
  }

  async remove(
    id: string,
    user: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const kyc = await this.findOne(id);

    await this.prisma.kyc.delete({
      where: { id },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.DELETE,
      ActivityEntityType.KYC,
      id,
      'KYC deleted',
      kyc,
      null,
      ipAddress,
      userAgent,
      user.tenantId,
    );
  }
}
