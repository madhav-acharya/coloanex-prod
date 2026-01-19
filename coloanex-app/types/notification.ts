export enum ActivityEntityType {
  ROLE = "ROLE",
  PERMISSION = "PERMISSION",
  USER = "USER",
  TENANT = "TENANT",
  BORROWER = "BORROWER",
  KYC = "KYC",
  LOAN = "LOAN",
}

export enum ActivityAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  KYC_VERIFY = "KYC_VERIFY",
  KYC_REJECT = "KYC_REJECT",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  PASSWORD_RESET = "PASSWORD_RESET",
  VISIT = "VISIT",
  LEAVE = "LEAVE",
}

export interface ActivityLogActor {
  id: string;
  fullName: string;
  email: string;
}

export interface NotificationItem {
  id: string;
  actorUserId: string | null;
  tenantId: string | null;
  entityType: ActivityEntityType;
  entityId: string | null;
  action: ActivityAction;
  description: string | null;
  before: unknown | null;
  after: unknown | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actorUser: ActivityLogActor | null;
  isRead: boolean;
  readAt?: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllAsReadResponse {
  count: number;
}
