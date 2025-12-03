import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '../prisma.service';
import type { RolesQueryInterface } from './interfaces/roles.query.interface';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  ActivityAction,
  ActivityEntityType,
} from '../activity-logs/entities/activity-log.entity';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(createRoleDto: CreateRoleDto, user: JwtPayload) {
    const { permissionIds, ...roleData } = createRoleDto;

    const role = await this.prisma.role.create({
      data: roleData,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.CREATE,
      ActivityEntityType.ROLE,
      role.id.toString(),
      `Role created: ${role.name}`,
      null,
      role,
      undefined,
      undefined,
      user.tenantId,
    );

    if (permissionIds && permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      });

      return this.prisma.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    }

    return role;
  }

  async findAll(query: RolesQueryInterface, user: JwtPayload) {
    const {
      page = 1,
      limit = 10,
      sort = 'id',
      order = 'desc',
      search = '',
      name,
      startDate,
      endDate,
      createdAtFrom,
      createdAtTo,
      updatedAtFrom,
      updatedAtTo,
    } = query;

    const skip = (+page - 1) * +limit;
    const take = +limit;
    const orderBy = {
      [sort]: order.toLowerCase() === 'asc' ? 'asc' : 'desc',
    } as Prisma.RoleOrderByWithRelationInput;

    const baseWhere: Prisma.RoleWhereInput = {};

    const filters: Prisma.RoleWhereInput[] = [];

    if (search) {
      filters.push({
        OR: [
          {
            name: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      });
    }

    if (name) {
      filters.push({
        name: {
          contains: name,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (startDate || endDate || createdAtFrom || createdAtTo) {
      const dateFilter: { gte?: Date; lte?: Date } = {};

      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      if (createdAtFrom) {
        dateFilter.gte = new Date(createdAtFrom);
      }
      if (createdAtTo) {
        dateFilter.lte = new Date(createdAtTo);
      }

      if (Object.keys(dateFilter).length > 0) {
        filters.push({ createdAt: dateFilter });
      }
    }

    if (updatedAtFrom || updatedAtTo) {
      const updatedDateFilter: { gte?: Date; lte?: Date } = {};

      if (updatedAtFrom) {
        updatedDateFilter.gte = new Date(updatedAtFrom);
      }
      if (updatedAtTo) {
        updatedDateFilter.lte = new Date(updatedAtTo);
      }

      if (Object.keys(updatedDateFilter).length > 0) {
        filters.push({ updatedAt: updatedDateFilter });
      }
    }

    const where: Prisma.RoleWhereInput = {
      ...baseWhere,
      ...(filters.length > 0 ? { AND: filters } : {}),
    };

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              users: true,
              permissions: true,
            },
          },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    const totalPages = Math.ceil(total / +limit);
    const hasNextPage = +page < totalPages;
    const hasPreviousPage = +page > 1;

    return {
      data: roles,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      currentPage: +page,
      limit: take,
    };
  }

  async findOne(id: bigint, user: JwtPayload) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: bigint, updateRoleDto: UpdateRoleDto, user: JwtPayload) {
    const existingRole = await this.findOne(id, user);

    const { permissionIds, ...roleData } = updateRoleDto;

    delete roleData.id;

    await this.prisma.role.update({
      where: { id },
      data: roleData,
    });

    if (permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      if (permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    const updatedRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.UPDATE,
      ActivityEntityType.ROLE,
      id.toString(),
      `Role updated: ${updatedRole?.name}`,
      existingRole,
      updatedRole,
      undefined,
      undefined,
      user.tenantId,
    );

    return updatedRole;
  }

  async remove(id: bigint, user: JwtPayload) {
    const existingRole = await this.findOne(id, user);

    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new ForbiddenException(
        'Cannot delete role that is assigned to users',
      );
    }

    const deletedRole = await this.prisma.role.delete({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.DELETE,
      ActivityEntityType.ROLE,
      id.toString(),
      `Role deleted: ${deletedRole.name}`,
      existingRole,
      null,
      undefined,
      undefined,
      user.tenantId,
    );

    return deletedRole;
  }
}
