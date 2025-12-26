export interface SessionData {
  userId: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt: Date;
  lastActivity: Date;
}
