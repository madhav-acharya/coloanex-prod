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
  profileImage?: string;
  isActive: boolean;
  gasPaymentMode?: "USER_WALLET" | "PLATFORM_WALLET";
  lastActiveAt?: string;
  roles: {
    roleId: string;
    userId: string;
    role: {
      id: string;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  }[];
  permissions: (| string
    | {
        userId?: string;
        permissionId?: string;
        permission?: {
          id: string;
          name: string;
          description?: string;
        };
        id?: string;
        name?: string;
      })[];
  tenantId?: string;
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
