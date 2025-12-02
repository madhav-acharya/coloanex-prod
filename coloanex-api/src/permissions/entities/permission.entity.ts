export class Permission {
  id: bigint;
  name: string;
  isSystem: boolean;
  description?: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}
