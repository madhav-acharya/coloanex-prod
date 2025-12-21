export interface CreateBorrowerDto {
  tenantId: string;
  userId: string;
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
}
