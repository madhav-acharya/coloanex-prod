import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from '../prisma.service';
import type { PermissionsQueryInterface } from './interfaces/permissions.query.interface';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  ActivityAction,
  ActivityEntityType,
} from '../activity-logs/entities/activity-log.entity';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(createPermissionDto: CreatePermissionDto, user: JwtPayload) {
    const permission = await this.prisma.permission.create({
      data: createPermissionDto,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        users: {
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
        _count: {
          select: {
            roles: true,
            users: true,
          },
        },
      },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.CREATE,
      ActivityEntityType.PERMISSION,
      permission.id.toString(),
      'Permission created',
      null,
      permission,
      undefined,
      undefined,
      user.tenantId,
    );

    return permission;
  }

  async findAll(query: PermissionsQueryInterface) {
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
      roleId,
      userId,
    } = query;

    const skip = (+page - 1) * +limit;
    const take = +limit;
    const orderBy = {
      [sort]: order.toLowerCase() === 'asc' ? 'asc' : 'desc',
    } as Prisma.PermissionOrderByWithRelationInput;

    const baseWhere: Prisma.PermissionWhereInput = {};

    const filters: Prisma.PermissionWhereInput[] = [];

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

    if (roleId) {
      filters.push({
        roles: {
          some: {
            roleId: BigInt(roleId),
          },
        },
      });
    }

    if (userId) {
      filters.push({
        users: {
          some: {
            userId: userId,
          },
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

    const where: Prisma.PermissionWhereInput = {
      ...baseWhere,
      ...(filters.length > 0 ? { AND: filters } : {}),
    };

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
              roles: true,
              users: true,
            },
          },
        },
      }),
      this.prisma.permission.count({ where }),
    ]);

    const totalPages = Math.ceil(total / +limit);
    const hasNextPage = +page < totalPages;
    const hasPreviousPage = +page > 1;

    return {
      data: permissions,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      currentPage: +page,
      limit: take,
    };
  }

  async findOne(id: bigint) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
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
            roles: true,
            users: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async update(
    id: bigint,
    updatePermissionDto: UpdatePermissionDto,
    user: JwtPayload,
  ) {
    const existingPermission = await this.findOne(id);

    delete updatePermissionDto.id;

    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        users: {
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
        _count: {
          select: {
            roles: true,
            users: true,
          },
        },
      },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.UPDATE,
      ActivityEntityType.PERMISSION,
      id.toString(),
      'Permission updated',
      existingPermission,
      updatedPermission,
      undefined,
      undefined,
      user.tenantId,
    );

    return updatedPermission;
  }

  async remove(id: bigint, user: JwtPayload) {
    const existingPermission = await this.findOne(id);

    const roleCount = await this.prisma.rolePermission.count({
      where: { permissionId: id },
    });

    if (roleCount > 0) {
      throw new ForbiddenException(
        'Cannot delete permission that is assigned to roles',
      );
    }

    const userCount = await this.prisma.userPermission.count({
      where: { permissionId: id },
    });

    if (userCount > 0) {
      throw new ForbiddenException(
        'Cannot delete permission that is assigned to users',
      );
    }

    const deletedPermission = await this.prisma.permission.delete({
      where: { id },
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.DELETE,
      ActivityEntityType.PERMISSION,
      id.toString(),
      'Permission deleted',
      existingPermission,
      null,
      undefined,
      undefined,
      user.tenantId,
    );

    return deletedPermission;
  }

  async assignPermissionsToRole(
    roleId: bigint,
    permissionIds: bigint[],
    user: JwtPayload,
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
      },
      select: { id: true },
    });

    if (permissions.length !== permissionIds.length) {
      throw new ForbiddenException(
        'Some permissions not found or not accessible',
      );
    }

    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    const result = await this.prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId,
        permissionId: permission.id,
      })),
    });

    await this.activityLogsService.logUserActivity(
      user.sub,
      ActivityAction.UPDATE,
      ActivityEntityType.ROLE,
      roleId.toString(),
      `Permissions assigned to role: ${role.name}`,
      null,
      { roleId, permissionIds },
      undefined,
      undefined,
      user.tenantId,
    );

    return result;
  }
}
