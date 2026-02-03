import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  READ_ROLES,
  CREATE_ROLES,
  UPDATE_ROLES,
  DELETE_ROLES,
  READ_PERMISSIONS,
  CREATE_PERMISSIONS,
  UPDATE_PERMISSIONS,
  DELETE_PERMISSIONS,
  READ_USERS,
  CREATE_USERS,
  UPDATE_USERS,
  DELETE_USERS,
  READ_TENANTS,
  CREATE_TENANTS,
  UPDATE_TENANTS,
  DELETE_TENANTS,
  READ_BORROWERS,
  CREATE_BORROWERS,
  UPDATE_BORROWERS,
  DELETE_BORROWERS,
  READ_KYC_DOCUMENTS,
  CREATE_KYC_DOCUMENTS,
  UPDATE_KYC_DOCUMENTS,
  DELETE_KYC_DOCUMENTS,
  APPROVE_KYC_DOCUMENTS,
  READ_LOANS,
  CREATE_LOANS,
  UPDATE_LOANS,
  DELETE_LOANS,
  APPROVE_LOANS,
  READ_LENDERS,
  CREATE_LENDERS,
  UPDATE_LENDERS,
  DELETE_LENDERS,
  READ_PAYMENTS,
  CREATE_PAYMENTS,
  UPDATE_PAYMENTS,
  DELETE_PAYMENTS,
  READ_NOTIFICATIONS,
  CREATE_NOTIFICATIONS,
  UPDATE_NOTIFICATIONS,
  DELETE_NOTIFICATIONS,
  READ_CONTRACTS,
  CREATE_CONTRACTS,
  UPDATE_CONTRACTS,
  DELETE_CONTRACTS,
  READ_TRANSACTIONS,
  CREATE_TRANSACTIONS,
  UPDATE_TRANSACTIONS,
  DELETE_TRANSACTIONS,
  READ_WALLETS,
  CREATE_WALLETS,
  UPDATE_WALLETS,
  DELETE_WALLETS,
  READ_RULES,
  CREATE_RULES,
  UPDATE_RULES,
  DELETE_RULES,
  READ_REPORTS,
  GENERATE_REPORTS,
  READ_PAYMENT_SCHEDULES,
  CREATE_PAYMENT_SCHEDULES,
  UPDATE_PAYMENT_SCHEDULES,
  DELETE_PAYMENT_SCHEDULES,
  READ_ACTIVITY_LOGS,
} from '../common/constants/permissions.constants';

@Injectable()
export class PermissionAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  private getSuperAdminPermissions(): string[] {
    return [
      READ_ROLES,
      CREATE_ROLES,
      UPDATE_ROLES,
      DELETE_ROLES,
      READ_PERMISSIONS,
      CREATE_PERMISSIONS,
      UPDATE_PERMISSIONS,
      DELETE_PERMISSIONS,
      READ_USERS,
      CREATE_USERS,
      UPDATE_USERS,
      DELETE_USERS,
      READ_TENANTS,
      CREATE_TENANTS,
      UPDATE_TENANTS,
      DELETE_TENANTS,
      READ_BORROWERS,
      CREATE_BORROWERS,
      UPDATE_BORROWERS,
      DELETE_BORROWERS,
      READ_KYC_DOCUMENTS,
      CREATE_KYC_DOCUMENTS,
      UPDATE_KYC_DOCUMENTS,
      DELETE_KYC_DOCUMENTS,
      APPROVE_KYC_DOCUMENTS,
      READ_LOANS,
      CREATE_LOANS,
      UPDATE_LOANS,
      DELETE_LOANS,
      APPROVE_LOANS,
      READ_LENDERS,
      CREATE_LENDERS,
      UPDATE_LENDERS,
      DELETE_LENDERS,
      READ_PAYMENTS,
      CREATE_PAYMENTS,
      UPDATE_PAYMENTS,
      DELETE_PAYMENTS,
      READ_NOTIFICATIONS,
      CREATE_NOTIFICATIONS,
      UPDATE_NOTIFICATIONS,
      DELETE_NOTIFICATIONS,
      READ_CONTRACTS,
      CREATE_CONTRACTS,
      UPDATE_CONTRACTS,
      DELETE_CONTRACTS,
      READ_TRANSACTIONS,
      CREATE_TRANSACTIONS,
      UPDATE_TRANSACTIONS,
      DELETE_TRANSACTIONS,
      READ_WALLETS,
      CREATE_WALLETS,
      UPDATE_WALLETS,
      DELETE_WALLETS,
      READ_RULES,
      CREATE_RULES,
      UPDATE_RULES,
      DELETE_RULES,
      READ_REPORTS,
      GENERATE_REPORTS,
      READ_PAYMENT_SCHEDULES,
      CREATE_PAYMENT_SCHEDULES,
      UPDATE_PAYMENT_SCHEDULES,
      DELETE_PAYMENT_SCHEDULES,
      READ_ACTIVITY_LOGS,
    ];
  }

  private getAdminPermissions(): string[] {
    return [
      READ_USERS,
      CREATE_USERS,
      UPDATE_USERS,
      DELETE_USERS,
      READ_BORROWERS,
      CREATE_BORROWERS,
      UPDATE_BORROWERS,
      DELETE_BORROWERS,
      READ_KYC_DOCUMENTS,
      CREATE_KYC_DOCUMENTS,
      UPDATE_KYC_DOCUMENTS,
      DELETE_KYC_DOCUMENTS,
      APPROVE_KYC_DOCUMENTS,
      READ_LOANS,
      CREATE_LOANS,
      UPDATE_LOANS,
      DELETE_LOANS,
      APPROVE_LOANS,
      READ_LENDERS,
      CREATE_LENDERS,
      UPDATE_LENDERS,
      DELETE_LENDERS,
      READ_PAYMENTS,
      CREATE_PAYMENTS,
      UPDATE_PAYMENTS,
      DELETE_PAYMENTS,
      READ_NOTIFICATIONS,
      CREATE_NOTIFICATIONS,
      UPDATE_NOTIFICATIONS,
      DELETE_NOTIFICATIONS,
      READ_CONTRACTS,
      CREATE_CONTRACTS,
      UPDATE_CONTRACTS,
      DELETE_CONTRACTS,
      READ_TRANSACTIONS,
      CREATE_TRANSACTIONS,
      UPDATE_TRANSACTIONS,
      DELETE_TRANSACTIONS,
      READ_WALLETS,
      CREATE_WALLETS,
      UPDATE_WALLETS,
      DELETE_WALLETS,
      READ_RULES,
      CREATE_RULES,
      UPDATE_RULES,
      DELETE_RULES,
      READ_REPORTS,
      GENERATE_REPORTS,
      READ_PAYMENT_SCHEDULES,
      CREATE_PAYMENT_SCHEDULES,
      UPDATE_PAYMENT_SCHEDULES,
      DELETE_PAYMENT_SCHEDULES,
      READ_ACTIVITY_LOGS,
    ];
  }

  private getLenderPermissions(): string[] {
    return [
      READ_USERS,
      CREATE_USERS,
      UPDATE_USERS,
      DELETE_USERS,
      READ_BORROWERS,
      CREATE_BORROWERS,
      UPDATE_BORROWERS,
      DELETE_BORROWERS,
      READ_KYC_DOCUMENTS,
      CREATE_KYC_DOCUMENTS,
      UPDATE_KYC_DOCUMENTS,
      DELETE_KYC_DOCUMENTS,
      APPROVE_KYC_DOCUMENTS,
      READ_LOANS,
      CREATE_LOANS,
      UPDATE_LOANS,
      APPROVE_LOANS,
      DELETE_LOANS,
      READ_LENDERS,
      CREATE_LENDERS,
      UPDATE_LENDERS,
      DELETE_LENDERS,
      READ_PAYMENTS,
      CREATE_PAYMENTS,
      UPDATE_PAYMENTS,
      DELETE_PAYMENTS,
      READ_NOTIFICATIONS,
      CREATE_NOTIFICATIONS,
      UPDATE_NOTIFICATIONS,
      DELETE_NOTIFICATIONS,
      READ_CONTRACTS,
      CREATE_CONTRACTS,
      UPDATE_CONTRACTS,
      DELETE_CONTRACTS,
      READ_TRANSACTIONS,
      CREATE_TRANSACTIONS,
      UPDATE_TRANSACTIONS,
      DELETE_TRANSACTIONS,
      READ_WALLETS,
      CREATE_WALLETS,
      UPDATE_WALLETS,
      DELETE_WALLETS,
      READ_RULES,
      CREATE_RULES,
      UPDATE_RULES,
      DELETE_RULES,
      READ_REPORTS,
      GENERATE_REPORTS,
      READ_PAYMENT_SCHEDULES,
      CREATE_PAYMENT_SCHEDULES,
      UPDATE_PAYMENT_SCHEDULES,
      DELETE_PAYMENT_SCHEDULES,
      READ_ACTIVITY_LOGS,
    ];
  }

  private getBorrowerPermissions(): string[] {
    return [
      READ_KYC_DOCUMENTS,
      CREATE_KYC_DOCUMENTS,
      UPDATE_KYC_DOCUMENTS,
      READ_USERS,
      UPDATE_USERS,
      READ_LOANS,
      CREATE_LOANS,
      UPDATE_LOANS,
      READ_PAYMENTS,
      CREATE_PAYMENTS,
      READ_NOTIFICATIONS,
      READ_CONTRACTS,
      READ_TRANSACTIONS,
      CREATE_TRANSACTIONS,
      READ_WALLETS,
      UPDATE_WALLETS,
      READ_PAYMENT_SCHEDULES,
    ];
  }

  async getPermissionsForRole(roleName: string): Promise<string[]> {
    const normalizedRoleName = roleName.toLowerCase();

    if (normalizedRoleName.includes('super admin')) {
      return this.getSuperAdminPermissions();
    } else if (normalizedRoleName.includes('admin')) {
      return this.getAdminPermissions();
    } else if (normalizedRoleName.includes('lender')) {
      return this.getLenderPermissions();
    } else if (normalizedRoleName.includes('borrower')) {
      return this.getBorrowerPermissions();
    }

    return [];
  }

  async assignPermissionsToUser(
    userId: string,
    roleNames: string[],
    additionalPermissionIds: bigint[] = [],
  ) {
    const allPermissionNames = new Set<string>();

    for (const roleName of roleNames) {
      const permissions = await this.getPermissionsForRole(roleName);
      permissions.forEach((perm) => allPermissionNames.add(perm));
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        OR: [
          {
            name: {
              in: Array.from(allPermissionNames),
            },
          },
          {
            id: {
              in: additionalPermissionIds,
            },
          },
        ],
      },
    });

    await this.prisma.userPermission.deleteMany({
      where: { userId },
    });

    if (permissions.length > 0) {
      const uniquePermissions = Array.from(
        new Map(permissions.map((p) => [p.id.toString(), p])).values(),
      );

      await this.prisma.userPermission.createMany({
        data: uniquePermissions.map((permission) => ({
          userId,
          permissionId: permission.id,
        })),
      });
    }
  }

  async assignPermissionsToRole(roleName: string, roleId: bigint) {
    const permissionNames = await this.getPermissionsForRole(roleName);

    const permissions = await this.prisma.permission.findMany({
      where: {
        name: {
          in: permissionNames,
        },
      },
    });

    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    if (permissions.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  async syncLenderPermissions() {
    const lenderRole = await this.prisma.role.findFirst({
      where: {
        name: {
          contains: 'Lender',
          mode: 'insensitive',
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!lenderRole) {
      return;
    }

    const lenderPermissions = await this.getPermissionsForRole(lenderRole.name);
    const permissions = await this.prisma.permission.findMany({
      where: {
        name: {
          in: lenderPermissions,
        },
      },
    });

    for (const userRole of lenderRole.users) {
      await this.prisma.userPermission.deleteMany({
        where: { userId: userRole.userId },
      });

      if (permissions.length > 0) {
        await this.prisma.userPermission.createMany({
          data: permissions.map((permission) => ({
            userId: userRole.userId,
            permissionId: permission.id,
          })),
        });
      }
    }
  }
}
