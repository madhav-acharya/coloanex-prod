export interface CreateUserForSignupDto {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  tenantId?: string;
  role?: string;
}
