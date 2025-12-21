export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  lastActiveAt?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user?: AuthUser;
}

export interface SignupRequest {
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
  tenantId?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
