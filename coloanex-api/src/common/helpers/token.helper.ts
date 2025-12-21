import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../interfaces/auth-tokens.interface';

export function generateAccessToken(
  jwtService: JwtService,
  payload: JwtPayload,
): string {
  return jwtService.sign(payload, {
    expiresIn: 900,
    algorithm: 'HS256',
  });
}

export function generateRefreshToken(
  jwtService: JwtService,
  userId: string,
  sessionId: string,
): string {
  if (!process.env.JWT_REFRESH_SECRET && !process.env.JWT_SECRET) {
    throw new Error('JWT refresh secret is not configured');
  }

  return jwtService.sign(
    { sub: userId, sessionId },
    {
      expiresIn: 604800,
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      algorithm: 'HS256',
    },
  );
}

export function generateTokenPair(
  jwtService: JwtService,
  payload: JwtPayload,
): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(jwtService, payload),
    refreshToken: generateRefreshToken(
      jwtService,
      payload.sub,
      payload.sessionId,
    ),
  };
}
