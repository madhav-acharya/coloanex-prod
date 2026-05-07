import type { AuthUser } from "@/types/auth";

const hasRole = (
  user: AuthUser | null | undefined,
  roleName: string,
): boolean =>
  user?.roles?.some(
    (ur) => ur.role?.name?.toLowerCase() === roleName.toLowerCase(),
  ) ?? false;

export const getRoles = (user: AuthUser | null | undefined) => ({
  isSuperAdmin: hasRole(user, "Super Admin"),
  isAdmin: hasRole(user, "Admin"),
  isLender: hasRole(user, "Lender"),
  isBorrower: hasRole(user, "Borrower"),
});

export const getHomeRoute = (user: AuthUser | null | undefined): string => {
  const { isSuperAdmin, isAdmin, isLender } = getRoles(user);
  if (isSuperAdmin || isAdmin || isLender) return "/dashboard";
  return "/dashboard";
};

export const canAccessAdminRoutes = (
  user: AuthUser | null | undefined,
): boolean => {
  const { isSuperAdmin, isAdmin, isLender } = getRoles(user);
  return isSuperAdmin || isAdmin || isLender;
};

export const canAccessBorrowerRoutes = (
  user: AuthUser | null | undefined,
): boolean => {
  const { isBorrower } = getRoles(user);
  return isBorrower;
};

export const canAccessSuperAdminRoutes = (
  user: AuthUser | null | undefined,
): boolean => {
  return hasRole(user, "Super Admin");
};
