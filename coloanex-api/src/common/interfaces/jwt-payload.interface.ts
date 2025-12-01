export interface JwtPayload {
  sub: string;
  sid: string;
  scope: string[];
  iss: string;
  aud: string;
  iat: number;
  nbf: number;
  exp: number;
  jti: string;
  tenantId?: string;
  roles?: string[];
}
