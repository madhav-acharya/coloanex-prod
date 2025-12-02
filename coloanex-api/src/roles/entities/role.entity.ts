import { Permission } from '../../permissions/entities/permission.entity';

export class Role {
  id: bigint;
  name: string;
  isSystem: boolean;
  description?: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;

  permissions?: Permission[];
}

export class RoleEntity extends Role {}
