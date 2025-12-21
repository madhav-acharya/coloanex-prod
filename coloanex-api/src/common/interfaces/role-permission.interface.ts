export interface RoleWithPermissions {
  role: {
    name: string;
    permissions: { permission: { name: string } }[];
  };
}

export interface UserPermission {
  permission: { name: string };
}
