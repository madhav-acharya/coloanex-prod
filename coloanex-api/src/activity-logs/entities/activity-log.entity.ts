export enum ActivityEntityType {
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  USER = 'USER',
  TENANT = 'TENANT',
  BORROWER = 'BORROWER',
  KYC_DOCUMENT = 'KYC_DOCUMENT',
}

export enum ActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  KYC_VERIFY = 'KYC_VERIFY',
  KYC_REJECT = 'KYC_REJECT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  VISIT = 'VISIT',
  LEAVE = 'LEAVE',
}

export class ActivityLog {
  id: string;
  actorUserId?: string;
  tenantId?: string;
  entityType: ActivityEntityType;
  entityId?: string;
  action: ActivityAction;
  description?: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
