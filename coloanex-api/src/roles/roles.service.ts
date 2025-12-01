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

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto, user: JwtPayload) {
    const { permissionIds, ...roleData } = createRoleDto;

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (
      !isSuperAdmin &&
      createRoleDto.tenantId &&
      createRoleDto.tenantId !== user.tenantId
    ) {
      throw new ForbiddenException(
        'You can only create roles for your own tenant',
      );
    }

    const finalRoleData = {
      ...roleData,
      tenantId: isSuperAdmin ? createRoleDto.tenantId : user.tenantId,
      isSystem: isSuperAdmin ? createRoleDto.isSystem || false : false,
    };

    const role = await this.prisma.role.create({
      data: finalRoleData,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        tenant: true,
      },
    });

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
          tenant: true,
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
      isSystem,
      tenantId,
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

    const isSuperAdmin = user.roles?.includes('Super Admin');

    const baseWhere: Prisma.RoleWhereInput = {};

    if (!isSuperAdmin) {
      baseWhere.tenantId = user.tenantId;
    } else if (tenantId) {
      baseWhere.tenantId = tenantId;
    }

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

    if (typeof isSystem === 'boolean') {
      filters.push({ isSystem });
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
          tenant: true,
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
        tenant: true,
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

    if (!isSuperAdmin && role.tenantId !== user.tenantId) {
      throw new ForbiddenException(
        'You can only access roles from your own tenant',
      );
    }

    return role;
  }

  async update(id: bigint, updateRoleDto: UpdateRoleDto, user: JwtPayload) {
    const existingRole = await this.findOne(id, user);

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (
      !isSuperAdmin &&
      updateRoleDto.tenantId &&
      updateRoleDto.tenantId !== user.tenantId
    ) {
      throw new ForbiddenException(
        'You can only update roles for your own tenant',
      );
    }

    if (!isSuperAdmin && existingRole.isSystem) {
      throw new ForbiddenException('You cannot modify system roles');
    }

    const { permissionIds, ...roleData } = updateRoleDto;

    const finalUpdateData = {
      ...roleData,
      tenantId: isSuperAdmin ? updateRoleDto.tenantId : user.tenantId,
      isSystem: isSuperAdmin
        ? updateRoleDto.isSystem !== undefined
          ? updateRoleDto.isSystem
          : existingRole.isSystem
        : existingRole.isSystem,
    };

    delete finalUpdateData.id;

    await this.prisma.role.update({
      where: { id },
      data: finalUpdateData,
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

    return this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        tenant: true,
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });
  }

  async remove(id: bigint, user: JwtPayload) {
    const existingRole = await this.findOne(id, user);

    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (!isSuperAdmin && existingRole.isSystem) {
      throw new ForbiddenException('You cannot delete system roles');
    }

    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new ForbiddenException(
        'Cannot delete role that is assigned to users',
      );
    }

    return this.prisma.role.delete({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        tenant: true,
      },
    });
  }
}
