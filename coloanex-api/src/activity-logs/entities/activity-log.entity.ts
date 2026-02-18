export enum ActivityEntityType {
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  USER = 'USER',
  TENANT = 'TENANT',
  BORROWER = 'BORROWER',
  KYC = 'KYC',
  LOAN = 'LOAN',
  CONTRACT = 'CONTRACT',
  RULE = 'RULE',
  PAYMENT = 'PAYMENT',
}

export enum ActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  KYC_VERIFY = 'KYC_VERIFY',
  KYC_REJECT = 'KYC_REJECT',
  LOAN_APPROVE = 'LOAN_APPROVE',
  LOAN_REJECT = 'LOAN_REJECT',
  CONTRACT_SIGN = 'CONTRACT_SIGN',
  LOAN_DISBURSE = 'LOAN_DISBURSE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
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
