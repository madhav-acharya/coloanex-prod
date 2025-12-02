import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

export class User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
  isBanned: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
  lastActiveAt?: Date;

  roles?: Role[];
  permissions?: Permission[];
}
