import type {
  RoleWithPermissions,
  UserPermission,
} from '../interfaces/role-permission.interface';
import type { JwtPayload } from '../interfaces/auth-tokens.interface';

export function extractRolesAndPermissions(user: {
  roles: unknown[];
  permissions: unknown[];
}): { roles: string[]; permissions: string[] } {
  const roles = (user.roles as RoleWithPermissions[]).map((ur) => ur.role.name);
  const permissions = [
    ...(user.roles as RoleWithPermissions[]).flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    ),
    ...(user.permissions as UserPermission[]).map((up) => up.permission.name),
  ];

  return { roles, permissions };
}

export function createJwtPayload(
  userId: string,
  email: string,
  roles: string[],
  permissions: string[],
  sessionId: string,
  tenantId?: string,
): JwtPayload {
  return {
    sub: userId,
    email,
    tenantId,
    roles,
    permissions,
    sessionId,
  };
}

export function createUserResponse(
  user: {
    id: string;
    email: string;
    fullName?: string;
    phone?: string | null;
    isActive: boolean;
    gasPaymentMode?: string;
    lastActiveAt?: Date | null;
  },
  roles: string[],
  permissions: string[],
) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || '',
    phone: user.phone || undefined,
    isActive: user.isActive,
    gasPaymentMode: user.gasPaymentMode || 'PLATFORM_WALLET',
    lastActiveAt: user.lastActiveAt || undefined,
    roles,
    permissions,
  };
}
