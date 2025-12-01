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

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto, user: JwtPayload) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (
      !isSuperAdmin &&
      createPermissionDto.tenantId &&
      createPermissionDto.tenantId !== user.tenantId
    ) {
      throw new ForbiddenException(
        'You can only create permissions for your own tenant',
      );
    }

    const finalPermissionData = {
      ...createPermissionDto,
      tenantId: isSuperAdmin
        ? (createPermissionDto.tenantId as string | null)
        : (user.tenantId as string | null),
      isSystem: isSuperAdmin ? Boolean(createPermissionDto.isSystem) : false,
    };

    const permission = await this.prisma.permission.create({
      data: finalPermissionData,
      include: {
        tenant: true,
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

    await this.logActivity(
      user.sub,
      user.tenantId,
      'PERMISSION',
      permission.id.toString(),
      'CREATE',
      'Permission created',
      null,
      permission,
    );

    return permission;
  }

  async findAll(query: PermissionsQueryInterface, user: JwtPayload) {
    const {
      page = 1,
      limit = 10,
      sort = 'id',
      order = 'desc',
      search = '',
      name,
      isSystem,
      tenantId,
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

    const isSuperAdmin = user.roles?.includes('Super Admin');

    const baseWhere: Prisma.PermissionWhereInput = {};

    if (!isSuperAdmin) {
      baseWhere.tenantId = user.tenantId;
    } else if (tenantId) {
      baseWhere.tenantId = tenantId;
    }

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

    if (typeof isSystem === 'boolean') {
      filters.push({ isSystem });
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
          tenant: true,
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  isSystem: true,
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

  async findOne(id: bigint, user: JwtPayload) {
    const isSuperAdmin = user.roles?.includes('Super Admin');

    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        tenant: true,
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

    if (!isSuperAdmin && permission.tenantId !== user.tenantId) {
      throw new ForbiddenException(
        'You can only access permissions from your own tenant',
      );
    }

    return permission;
  }

  async update(
    id: bigint,
    updatePermissionDto: UpdatePermissionDto,
    user: JwtPayload,
  ) {
    const existingPermission = await this.findOne(id, user);

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (
      !isSuperAdmin &&
      updatePermissionDto.tenantId &&
      updatePermissionDto.tenantId !== user.tenantId
    ) {
      throw new ForbiddenException(
        'You can only update permissions for your own tenant',
      );
    }

    if (!isSuperAdmin && existingPermission.isSystem) {
      throw new ForbiddenException('You cannot modify system permissions');
    }

    const finalUpdateData = {
      ...updatePermissionDto,
      tenantId: isSuperAdmin
        ? (updatePermissionDto.tenantId as string | null)
        : (user.tenantId as string | null),
      isSystem: isSuperAdmin
        ? updatePermissionDto.isSystem !== undefined
          ? Boolean(updatePermissionDto.isSystem)
          : existingPermission.isSystem
        : existingPermission.isSystem,
    };

    delete finalUpdateData.id;

    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: finalUpdateData,
      include: {
        tenant: true,
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

    await this.logActivity(
      user.sub,
      user.tenantId,
      'PERMISSION',
      id.toString(),
      'UPDATE',
      'Permission updated',
      existingPermission,
      updatedPermission,
    );

    return updatedPermission;
  }

  async remove(id: bigint, user: JwtPayload) {
    const existingPermission = await this.findOne(id, user);

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin && existingPermission.isSystem) {
      throw new ForbiddenException('You cannot delete system permissions');
    }

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
      include: {
        tenant: true,
      },
    });

    await this.logActivity(
      user.sub,
      user.tenantId,
      'PERMISSION',
      id.toString(),
      'DELETE',
      'Permission deleted',
      existingPermission,
      null,
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
      include: { tenant: true },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin && role.tenantId !== user.tenantId) {
      throw new ForbiddenException(
        'You can only assign permissions to roles from your own tenant',
      );
    }

    if (!isSuperAdmin && role.isSystem) {
      throw new ForbiddenException('You cannot modify system roles');
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
        ...(isSuperAdmin ? {} : { tenantId: user.tenantId }),
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

    await this.logActivity(
      user.sub,
      user.tenantId,
      'ROLE',
      roleId.toString(),
      'UPDATE',
      `Permissions assigned to role: ${role.name}`,
      null,
      { roleId, permissionIds },
    );

    return result;
  }

  private async logActivity(
    actorUserId: string,
    tenantId: string | undefined,
    entityType: 'PERMISSION' | 'ROLE',
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    description: string,
    before: any,
    after: any,
  ) {
    try {
      await this.prisma.activityLog.create({
        data: {
          actorUserId,
          tenantId,
          entityType,
          entityId,
          action,
          description,
          before: before ? JSON.stringify(before) : undefined,
          after: after ? JSON.stringify(after) : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}
