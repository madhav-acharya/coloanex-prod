import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma.service';
import type { UsersQueryInterface } from './interfaces/users.query.interface';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { BorrowersService } from '../borrowers/borrowers.service';
import {
  ActivityAction,
  ActivityEntityType,
} from '../activity-logs/entities/activity-log.entity';

interface CreateUserForSignupDto {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  tenantId?: string;
  role?: string;
}

export type { CreateUserForSignupDto };

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly borrowersService: BorrowersService,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser: JwtPayload) {
    if (!createUserDto.email && !createUserDto.phone) {
      throw new BadRequestException(
        'Either email or phone number must be provided',
      );
    }

    const isSuperAdmin = currentUser.roles?.includes('Super Admin');

    if (
      !isSuperAdmin &&
      createUserDto.tenantId &&
      createUserDto.tenantId !== currentUser.tenantId
    ) {
      throw new ForbiddenException(
        'You can only create users for your own tenant',
      );
    }

    if (createUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (createUserDto.phone) {
      const existingUser = await this.prisma.user.findUnique({
        where: { phone: createUserDto.phone },
      });
      if (existingUser) {
        throw new ConflictException(
          'User with this phone number already exists',
        );
      }
    }

    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      const roles = await this.prisma.role.findMany({
        where: {
          id: { in: createUserDto.roleIds },
        },
        select: { id: true, name: true },
      });

      if (roles.length !== createUserDto.roleIds.length) {
        throw new BadRequestException('Some roles not found or not accessible');
      }
    }

    if (createUserDto.permissionIds && createUserDto.permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: {
          id: { in: createUserDto.permissionIds },
        },
        select: { id: true },
      });

      if (permissions.length !== createUserDto.permissionIds.length) {
        throw new BadRequestException(
          'Some permissions not found or not accessible',
        );
      }
    }

    const hashedPassword = await argon2.hash(createUserDto.password, {
      type: argon2.argon2id,
      memoryCost: 64 * 1024,
      timeCost: 3,
      parallelism: 2,
    });

    const user = await this.prisma.user.create({
      data: {
        fullName: createUserDto.fullName,
        email: createUserDto.email,
        phone: createUserDto.phone ?? '',
        password: hashedPassword,
        tenantId: isSuperAdmin
          ? (createUserDto.tenantId as string | null)
          : (currentUser.tenantId as string | null),
        isActive: createUserDto.isActive ?? true,
        isBanned: createUserDto.isBanned ?? false,
        isEmailVerified: createUserDto.isEmailVerified ?? false,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        tenantId: true,
        isActive: true,
        isBanned: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      await this.prisma.userRole.createMany({
        data: createUserDto.roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
        })),
      });
    }

    if (createUserDto.permissionIds && createUserDto.permissionIds.length > 0) {
      await this.prisma.userPermission.createMany({
        data: createUserDto.permissionIds
          .filter((permissionId) => permissionId !== undefined)
          .map((permissionId) => ({
            userId: user.id,
            permissionId: permissionId,
          })),
      });
    }

    await this.logActivity(
      currentUser.sub,
      currentUser.tenantId,
      'USER',
      user.id,
      'CREATE',
      `User created: ${user.fullName}`,
      null,
      user,
    );

    return this.findOne(user.id, currentUser);
  }

  async createUserForSignup(
    createUserDto: CreateUserForSignupDto,
    ipAddress?: string,
    userAgent?: string,
    actorUserId?: string,
  ) {
    const { email, phone, password, fullName, tenantId, role } = createUserDto;

    // Check if user already exists
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUserByPhone = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUserByPhone) {
      throw new ConflictException('User with this phone number already exists');
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 64 * 1024,
      timeCost: 3,
      parallelism: 2,
    });

    const defaultRole = role || 'BORROWER';

    // Ensure borrower role exists
    let borrowerRole = await this.prisma.role.findFirst({
      where: { name: defaultRole },
    });

    if (!borrowerRole && defaultRole === 'BORROWER') {
      borrowerRole = await this.createDefaultBorrowerRole();
    }

    if (!borrowerRole) {
      throw new BadRequestException(`Role ${defaultRole} does not exist`);
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        tenantId,
        isEmailVerified: false,
        isActive: true,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Assign role
    await this.prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: borrowerRole.id,
      },
    });

    // Create borrower profile if role is BORROWER
    if (defaultRole === 'BORROWER') {
      await this.borrowersService.ensureBorrowerExists(
        user.id,
        user.tenantId || '',
        actorUserId,
        ipAddress,
        userAgent,
      );
    }

    // Log activity
    if (this.activityLogsService) {
      await this.activityLogsService.create({
        action: ActivityAction.CREATE,
        entityType: ActivityEntityType.USER,
        entityId: user.id,
        description: 'User registered with ' + defaultRole + ' role',
        before: null,
        after: {
          userId: user.id,
          role: defaultRole,
          email: user.email,
        },
        ipAddress,
        userAgent,
        actorUserId: actorUserId || user.id,
        tenantId: user.tenantId || undefined,
      });
    }

    // Return user without password
    const { password: userPassword, ...userWithoutPassword } = user;
    void userPassword;
    return {
      ...userWithoutPassword,
      role: defaultRole,
    };
  }

  private async createDefaultBorrowerRole() {
    const borrowerPermissions = await this.ensureBorrowerPermissions();

    const role = await this.prisma.role.create({
      data: {
        name: 'BORROWER',
        description: 'Default role for borrowers',
      },
    });

    for (const permission of borrowerPermissions) {
      if (permission.id !== undefined) {
        await this.prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }

    return role;
  }

  private async ensureBorrowerPermissions(): Promise<
    Prisma.PermissionUncheckedCreateInput[]
  > {
    const borrowerPermissions = [
      { name: 'VIEW_PROFILE', description: 'View own profile' },
      { name: 'UPDATE_PROFILE', description: 'Update own profile' },
      { name: 'UPLOAD_KYC', description: 'Upload KYC documents' },
      { name: 'VIEW_KYC_STATUS', description: 'View KYC verification status' },
      { name: 'REQUEST_LOAN', description: 'Request loans' },
      { name: 'VIEW_LOAN_HISTORY', description: 'View loan history' },
      { name: 'VIEW_REWARDS', description: 'View reward points' },
    ];

    const createdPermissions: Prisma.PermissionUncheckedCreateInput[] = [];

    for (const permData of borrowerPermissions) {
      let permission = await this.prisma.permission.findFirst({
        where: { name: permData.name },
      });

      if (!permission) {
        permission = await this.prisma.permission.create({
          data: {
            name: permData.name,
            description: permData.description,
          },
        });
      }

      createdPermissions.push(permission);
    }

    return createdPermissions;
  }

  async findAll(query: UsersQueryInterface, currentUser: JwtPayload) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search = '',
      fullName,
      email,
      phone,
      tenantId,
      isActive,
      isBanned,
      isEmailVerified,
      startDate,
      endDate,
      createdAtFrom,
      createdAtTo,
      updatedAtFrom,
      updatedAtTo,
      lastActiveAtFrom,
      lastActiveAtTo,
      roleId,
      permissionId,
    } = query;

    const skip = (+page - 1) * +limit;
    const take = +limit;
    const orderBy = {
      [sort]: order.toLowerCase() === 'asc' ? 'asc' : 'desc',
    } as Prisma.UserOrderByWithRelationInput;

    const isSuperAdmin = currentUser.roles?.includes('Super Admin');

    const baseWhere: Prisma.UserWhereInput = {};

    if (!isSuperAdmin) {
      baseWhere.tenantId = currentUser.tenantId;
    } else if (tenantId) {
      baseWhere.tenantId = tenantId;
    }

    const filters: Prisma.UserWhereInput[] = [];

    if (search) {
      filters.push({
        OR: [
          {
            fullName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            email: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            phone: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      });
    }

    if (fullName) {
      filters.push({
        fullName: {
          contains: fullName,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (email) {
      filters.push({
        email: {
          contains: email,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (phone) {
      filters.push({
        phone: {
          contains: phone,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (typeof isActive === 'boolean') {
      filters.push({ isActive });
    }

    if (typeof isBanned === 'boolean') {
      filters.push({ isBanned });
    }

    if (typeof isEmailVerified === 'boolean') {
      filters.push({ isEmailVerified });
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

    if (permissionId) {
      filters.push({
        permissions: {
          some: {
            permissionId: BigInt(permissionId),
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

    if (lastActiveAtFrom || lastActiveAtTo) {
      const lastActiveDateFilter: { gte?: Date; lte?: Date } = {};

      if (lastActiveAtFrom) {
        lastActiveDateFilter.gte = new Date(lastActiveAtFrom);
      }
      if (lastActiveAtTo) {
        lastActiveDateFilter.lte = new Date(lastActiveAtTo);
      }

      if (Object.keys(lastActiveDateFilter).length > 0) {
        filters.push({ lastActiveAt: lastActiveDateFilter });
      }
    }

    const where: Prisma.UserWhereInput = {
      ...baseWhere,
      ...(filters.length > 0 ? { AND: filters } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          tenantId: true,
          isActive: true,
          isBanned: true,
          isEmailVerified: true,
          lastActiveAt: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          _count: {
            select: {
              roles: true,
              permissions: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / +limit);
    const hasNextPage = +page < totalPages;
    const hasPreviousPage = +page > 1;

    return {
      data: users.map((user) => ({
        ...user,
        roles: user.roles.map((ur) => ur.role),
        permissions: user.permissions.map((up) => up.permission),
      })),
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      currentPage: +page,
      limit: take,
    };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const isSuperAdmin = currentUser.roles?.includes('Super Admin');

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        tenantId: true,
        isActive: true,
        isBanned: true,
        isEmailVerified: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        _count: {
          select: {
            roles: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!isSuperAdmin && user.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(
        'You can only access users from your own tenant',
      );
    }

    return {
      ...user,
      roles: user.roles.map((ur) => ur.role),
      permissions: user.permissions.map((up) => up.permission),
    };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: JwtPayload,
  ) {
    const existingUser = await this.findOne(id, currentUser);

    const isSuperAdmin = currentUser.roles?.includes('Super Admin');

    if (
      !isSuperAdmin &&
      updateUserDto.tenantId &&
      updateUserDto.tenantId !== currentUser.tenantId
    ) {
      throw new ForbiddenException(
        'You can only update users for your own tenant',
      );
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (emailExists && emailExists.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (updateUserDto.phone && updateUserDto.phone !== existingUser.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: updateUserDto.phone },
      });
      if (phoneExists && phoneExists.id !== id) {
        throw new ConflictException(
          'User with this phone number already exists',
        );
      }
    }

    if (updateUserDto.roleIds !== undefined) {
      if (updateUserDto.roleIds.length > 0) {
        const validRoleIds = updateUserDto.roleIds
          .filter((id) => id !== null && id !== undefined)
          .map((id) => BigInt(id));

        if (validRoleIds.length === 0) {
          throw new BadRequestException('No valid role IDs provided');
        }

        const roles = await this.prisma.role.findMany({
          where: {
            id: { in: validRoleIds },
          },
          select: { id: true, name: true },
        });

        if (roles.length !== validRoleIds.length) {
          throw new BadRequestException(
            'Some roles not found or not accessible',
          );
        }
      }
    }

    if (updateUserDto.permissionIds !== undefined) {
      if (updateUserDto.permissionIds.length > 0) {
        const validPermissionIds = updateUserDto.permissionIds
          .filter((id) => id !== null && id !== undefined)
          .map((id) => BigInt(id));

        if (validPermissionIds.length === 0) {
          throw new BadRequestException('No valid permission IDs provided');
        }

        const permissions = await this.prisma.permission.findMany({
          where: {
            id: { in: validPermissionIds },
          },
          select: { id: true },
        });

        if (permissions.length !== validPermissionIds.length) {
          throw new BadRequestException(
            'Some permissions not found or not accessible',
          );
        }
      }
    }

    const updateData: Prisma.UserUpdateInput = {
      fullName: updateUserDto.fullName,
      email: updateUserDto.email,
      phone: updateUserDto.phone,
      tenant: isSuperAdmin
        ? updateUserDto.tenantId
          ? { connect: { id: updateUserDto.tenantId } }
          : undefined
        : currentUser.tenantId
          ? { connect: { id: currentUser.tenantId } }
          : undefined,
      isActive: updateUserDto.isActive,
      isBanned: updateUserDto.isBanned,
      isEmailVerified: updateUserDto.isEmailVerified,
    };

    if (updateUserDto.password) {
      updateData.password = await argon2.hash(updateUserDto.password, {
        type: argon2.argon2id,
        memoryCost: 64 * 1024,
        timeCost: 3,
        parallelism: 2,
      });
    }

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    if (updateUserDto.roleIds !== undefined) {
      await this.prisma.userRole.deleteMany({
        where: { userId: id },
      });

      if (updateUserDto.roleIds.length > 0) {
        const validRoleIds = updateUserDto.roleIds
          .filter((id) => id !== null && id !== undefined)
          .map((id) => BigInt(id));

        if (validRoleIds.length > 0) {
          await this.prisma.userRole.createMany({
            data: validRoleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        }
      }
    }

    if (updateUserDto.permissionIds !== undefined) {
      await this.prisma.userPermission.deleteMany({
        where: { userId: id },
      });

      if (updateUserDto.permissionIds.length > 0) {
        const validPermissionIds = updateUserDto.permissionIds
          .filter((id) => id !== null && id !== undefined)
          .map((id) => BigInt(id));

        if (validPermissionIds.length > 0) {
          await this.prisma.userPermission.createMany({
            data: validPermissionIds.map((permissionId) => ({
              userId: id,
              permissionId,
            })),
          });
        }
      }
    }

    const updatedUser = await this.findOne(id, currentUser);

    await this.logActivity(
      currentUser.sub,
      currentUser.tenantId,
      'USER',
      id,
      'UPDATE',
      `User updated: ${updatedUser.fullName}`,
      existingUser,
      updatedUser,
    );

    return updatedUser;
  }

  async remove(id: string, currentUser: JwtPayload) {
    const existingUser = await this.findOne(id, currentUser);

    if (id === currentUser.sub) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const deletedUser = await this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });

    await this.logActivity(
      currentUser.sub,
      currentUser.tenantId,
      'USER',
      id,
      'DELETE',
      `User deleted: ${existingUser.fullName}`,
      existingUser,
      null,
    );

    return deletedUser;
  }

  async banUser(id: string, currentUser: JwtPayload) {
    const user = await this.findOne(id, currentUser);

    if (id === currentUser.sub) {
      throw new ForbiddenException('You cannot ban your own account');
    }

    if (user.isBanned) {
      throw new BadRequestException('User is already banned');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isBanned: true, isActive: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        isBanned: true,
        isActive: true,
      },
    });

    await this.logActivity(
      currentUser.sub,
      currentUser.tenantId,
      'USER',
      id,
      'UPDATE',
      `User banned: ${user.fullName}`,
      { isBanned: false },
      { isBanned: true },
    );

    return updatedUser;
  }

  async unbanUser(id: string, currentUser: JwtPayload) {
    const user = await this.findOne(id, currentUser);

    if (!user.isBanned) {
      throw new BadRequestException('User is not banned');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isBanned: false, isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        isBanned: true,
        isActive: true,
      },
    });

    await this.logActivity(
      currentUser.sub,
      currentUser.tenantId,
      'USER',
      id,
      'UPDATE',
      `User unbanned: ${user.fullName}`,
      { isBanned: true },
      { isBanned: false },
    );

    return updatedUser;
  }

  async activateUser(id: string, currentUser: JwtPayload) {
    const user = await this.findOne(id, currentUser);

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    });

    await this.logActivity(
      currentUser.sub,
      currentUser.tenantId,
      'USER',
      id,
      'UPDATE',
      `User activated: ${user.fullName}`,
      { isActive: false },
      { isActive: true },
    );

    return updatedUser;
  }

  async deactivateUser(id: string, currentUser: JwtPayload) {
    const user = await this.findOne(id, currentUser);

    if (id === currentUser.sub) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    if (!user.isActive) {
      throw new BadRequestException('User is already inactive');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    });

    await this.logActivity(
      currentUser.sub,
      currentUser.tenantId,
      'USER',
      id,
      'UPDATE',
      `User deactivated: ${user.fullName}`,
      { isActive: true },
      { isActive: false },
    );

    return updatedUser;
  }

  private async logActivity(
    actorUserId: string,
    tenantId: string | undefined,
    entityType: 'USER',
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    description: string,
    before: any,
    after: any,
  ) {
    try {
      await this.activityLogsService.logUserActivity(
        actorUserId,
        action as ActivityAction,
        entityType as ActivityEntityType,
        entityId,
        description,
        before,
        after,
        undefined,
        undefined,
        tenantId,
      );
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async markUserAsOnline(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        lastActiveAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        lastActiveAt: true,
        tenantId: true,
      },
    });

    if (this.activityLogsService) {
      await this.activityLogsService.logUserVisit(
        userId,
        ipAddress,
        userAgent,
        user.tenantId ?? undefined,
      );
    }

    return user;
  }

  async markUserAsOffline(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        lastActiveAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        lastActiveAt: true,
        tenantId: true,
      },
    });

    if (this.activityLogsService) {
      await this.activityLogsService.logUserLeave(
        userId,
        ipAddress,
        userAgent,
        user.tenantId ?? undefined,
      );
    }

    return user;
  }

  async updateUserActivity(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
      },
      select: {
        id: true,
        lastActiveAt: true,
      },
    });
  }

  async getOnlineUsers(tenantId?: string) {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(tenantId && { tenantId }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        lastActiveAt: true,
      },
      orderBy: {
        lastActiveAt: 'desc',
      },
    });
  }
}
