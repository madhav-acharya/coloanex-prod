import type { User } from "@/types/user";

interface RoleWithPermissions {
  id: string;
  name: string;
  description?: string;
  permissions?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

export const extractRolePermissions = (
  roles: RoleWithPermissions[],
): Set<string> => {
  const permissionIds = new Set<string>();
  roles.forEach((role) => {
    role.permissions?.forEach((perm) => {
      permissionIds.add(perm.id);
    });
  });
  return permissionIds;
};

export const extractUserRoleIds = (user: User): string[] => {
  if (!user) return [];
  return (
    user.roles
      ?.map((r) => {
        if (r && typeof r === "object") {
          if ("role" in r && r.role && typeof r.role === "object") {
            return (r.role as { id: string }).id;
          }
          if ("id" in r) {
            return (r as { id: string }).id;
          }
        }
        return null;
      })
      .filter((id): id is string => Boolean(id)) || []
  );
};

export const extractUserPermissionIds = (user: User): string[] => {
  if (!user) return [];
  return (
    user.permissions
      ?.map((p) => {
        if (p && typeof p === "object") {
          if (
            "permission" in p &&
            p.permission &&
            typeof p.permission === "object"
          ) {
            return (p.permission as { id: string }).id;
          }
          if ("id" in p) {
            return (p as { id: string }).id;
          }
        }
        return null;
      })
      .filter((id): id is string => Boolean(id)) || []
  );
};

export const extractUserRoles = (
  user: User,
): Array<{ id: string; name: string; description?: string }> => {
  if (!user) return [];
  return (
    user.roles
      ?.map((r) => {
        if (r && typeof r === "object") {
          if ("role" in r && r.role && typeof r.role === "object") {
            return r.role as {
              id: string;
              name: string;
              description?: string;
            };
          }
          if ("id" in r && "name" in r) {
            return r as { id: string; name: string; description?: string };
          }
        }
        return null;
      })
      .filter(
        (role): role is { id: string; name: string; description?: string } =>
          role !== null,
      ) || []
  );
};

export const extractUserPermissions = (
  user: User,
): Array<{ id: string; name: string; description?: string }> => {
  if (!user) return [];
  return (
    user.permissions
      ?.map((p) => {
        if (p && typeof p === "object") {
          if (
            "permission" in p &&
            p.permission &&
            typeof p.permission === "object"
          ) {
            return p.permission as {
              id: string;
              name: string;
              description?: string;
            };
          }
          if ("id" in p && "name" in p) {
            return p as { id: string; name: string; description?: string };
          }
        }
        return null;
      })
      .filter(
        (perm): perm is { id: string; name: string; description?: string } =>
          perm !== null,
      ) || []
  );
};

export const getAdditionalPermissionIds = (
  userPermissionIds: string[],
  rolePermissionIds: Set<string>,
): string[] => {
  return userPermissionIds.filter((permId) => !rolePermissionIds.has(permId));
};

export const hasPermission = (user: any, permissionName: string): boolean => {
  if (!user) return false;

  const userRoles = extractUserRoles(user);
  const isSuperAdmin = userRoles.some((role) => role.name === "Super Admin");
  if (isSuperAdmin) return true;

  const userPermissions = extractUserPermissions(user);

  const hasDirectPermission = userPermissions.some(
    (p) => p.name === permissionName,
  );

  if (hasDirectPermission) return true;

  return userRoles.some((role: any) => {
    return role.permissions?.some((p: any) => p.name === permissionName);
  });
};
