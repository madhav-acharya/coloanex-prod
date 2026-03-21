import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from '../prisma.service';
import type { TenantsQueryInterface } from './interfaces/tenants.query.interface';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { MailService } from '../mail/mail.service';
import { tenantCreationTemplate } from '../mail/templates';
import {
  ActivityAction,
  ActivityEntityType,
} from '../activity-logs/entities/activity-log.entity';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly mailService: MailService,
  ) {}

  async create(createTenantDto: CreateTenantDto, currentUser: JwtPayload) {
    const existingTenant = await this.prisma.tenant.findFirst({
      where: { name: createTenantDto.name },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this name already exists');
    }

    if (createTenantDto.ownerUserId) {
      const ownerUser = await this.prisma.user.findUnique({
        where: { id: createTenantDto.ownerUserId },
      });

      if (!ownerUser) {
        throw new BadRequestException('Owner user not found');
      }
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        isActive: createTenantDto.isActive ?? true,
        isBanned: createTenantDto.isBanned ?? false,
        contactEmail: createTenantDto.contactEmail,
        contactPhone: createTenantDto.contactPhone,
        address: createTenantDto.address,
        ownerUserId: createTenantDto.ownerUserId,
      },
      include: {
        ownerUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.activityLogsService.create({
      actorUserId: currentUser.sub,
      entityType: ActivityEntityType.TENANT,
      action: ActivityAction.CREATE,
      entityId: tenant.id,
      description: `Created tenant: ${tenant.name}`,
      after: { tenantName: tenant.name },
    });

    if (tenant.ownerUser) {
      try {
        const dashboardUrl =
          process.env.WEB_URL || 'https://web.example.com/dashboard';

        await this.mailService.sendMail(
          {
            to: tenant.ownerUser.email,
            subject: `Welcome to CoLoanEx - ${tenant.name} Created Successfully`,
            html: tenantCreationTemplate({
              tenantName: tenant.name,
              tenantLogo: tenant.logo || undefined,
              ownerName: tenant.ownerUser.fullName,
              ownerEmail: tenant.ownerUser.email,
              tenantId: tenant.id,
              dashboardUrl,
              supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
              tenantPrimaryColor: tenant.primaryColor || undefined,
              contactEmail: tenant.contactEmail || undefined,
              contactPhone: tenant.contactPhone || undefined,
              address: tenant.address || undefined,
              features: [
                'Loan Management System',
                'Borrower KYC Verification',
                'Payment Schedule Tracking',
                'Contract Generation',
                'Email Notifications',
                'Activity Logging',
                'Multi-user Access Control',
              ],
            }),
          },
          tenant.id,
        );
      } catch (error) {}
    }

    return tenant;
  }

  async findAll(query: TenantsQueryInterface) {
    const {
      page,
      limit = 10,
      offset,
      search = '',
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      isBanned,
    } = query;

    const limitNum = Number(limit);
    const skip =
      offset !== undefined
        ? Number(offset)
        : (Number(page || 1) - 1) * limitNum;
    const where: Prisma.TenantWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined && isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    if (isBanned !== undefined && isBanned !== 'all') {
      where.isBanned = isBanned === 'true';
    }

    const orderBy: Prisma.TenantOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.TenantOrderByWithRelationInput] =
        sortOrder as Prisma.SortOrder;
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          ownerUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              users: true,
              borrowers: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const currentPage = page ? Number(page) : Math.floor(skip / limitNum) + 1;

    return {
      data: tenants,
      total,
      totalPages,
      currentPage,
      limit: limitNum,
      hasNextPage: skip + limitNum < total,
      hasPreviousPage: skip > 0,
      hasMore: skip + limitNum < total,
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        ownerUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            users: true,
            borrowers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async update(
    id: string,
    updateTenantDto: UpdateTenantDto,
    currentUser: JwtPayload,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    if (updateTenantDto.name && updateTenantDto.name !== tenant.name) {
      const existingTenant = await this.prisma.tenant.findFirst({
        where: { name: updateTenantDto.name, id: { not: id } },
      });

      if (existingTenant) {
        throw new ConflictException('Tenant with this name already exists');
      }
    }

    if (updateTenantDto.ownerUserId) {
      const ownerUser = await this.prisma.user.findUnique({
        where: { id: updateTenantDto.ownerUserId },
      });

      if (!ownerUser) {
        throw new BadRequestException('Owner user not found');
      }
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: updateTenantDto.name,
        isActive: updateTenantDto.isActive,
        isBanned: updateTenantDto.isBanned,
        contactEmail: updateTenantDto.contactEmail,
        contactPhone: updateTenantDto.contactPhone,
        address: updateTenantDto.address,
        ownerUserId: updateTenantDto.ownerUserId,
      },
      include: {
        ownerUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            users: true,
            borrowers: true,
          },
        },
      },
    });

    await this.activityLogsService.create({
      actorUserId: currentUser.sub,
      entityType: ActivityEntityType.TENANT,
      action: ActivityAction.UPDATE,
      entityId: id,
      description: `Updated tenant: ${updatedTenant.name}`,
      after: { tenantName: updatedTenant.name },
    });

    return updatedTenant;
  }

  async remove(id: string, currentUser: JwtPayload) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            borrowers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    if (tenant._count.users > 0 || tenant._count.borrowers > 0) {
      throw new BadRequestException(
        'Cannot delete tenant with associated users or borrowers',
      );
    }

    await this.prisma.tenant.delete({
      where: { id },
    });

    await this.activityLogsService.create({
      actorUserId: currentUser.sub,
      entityType: ActivityEntityType.TENANT,
      action: ActivityAction.DELETE,
      entityId: id,
      description: `Deleted tenant: ${tenant.name}`,
      before: { tenantName: tenant.name },
    });

    return { message: 'Tenant deleted successfully' };
  }
}
