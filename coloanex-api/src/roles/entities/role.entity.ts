export class RoleEntity {
  id: bigint;
  name: string;
  isSystem: boolean;
  description?: string | null;
  tenantId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
