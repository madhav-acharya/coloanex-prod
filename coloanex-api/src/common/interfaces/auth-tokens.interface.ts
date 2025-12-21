export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    isActive: boolean;
    lastActiveAt?: Date;
    roles: string[];
    permissions: string[];
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}
