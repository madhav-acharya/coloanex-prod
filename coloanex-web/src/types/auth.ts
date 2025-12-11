export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface SignupRequest {
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  fullName: string;
  isActive: boolean;
  tenantId?: string;
  roles: Array<{
    roleId: number;
    userId: string;
    role: {
      id: number;
      name: string;
    };
  }>;
  permissions: Array<{
    permissionId: number;
    userId: string;
    permission: {
      id: number;
      name: string;
    };
  }>;
}
