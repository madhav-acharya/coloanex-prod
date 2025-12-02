import { Injectable } from '@nestjs/common';
import * as jose from 'jose';
import * as crypto from 'crypto';

@Injectable()
export class TokensService {
  private readonly privateKey: Promise<CryptoKey>;
  private readonly publicKey: Promise<CryptoKey>;

  constructor() {
    this.privateKey = jose.importPKCS8(
      process.env.PRIVATE_KEY!,
      process.env.JWK_ALGORITHM!,
    );

    this.publicKey = jose.importSPKI(
      process.env.PUBLIC_KEY!,
      process.env.JWK_ALGORITHM!,
    );
  }

  async signAccess(payload: {
    sub: string;
    sid: string;
    scope?: string[];
    laboratoryId?: string;
    roles?: string[];
  }) {
    const now = Math.floor(Date.now() / 1000);
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({
        alg: process.env.JWK_ALGORITHM!,
        kid: process.env.JWT_KID!,
        typ: 'JWT',
      })
      .setIssuer(process.env.JWT_ISS!)
      .setAudience(process.env.JWT_AUD!)
      .setIssuedAt(now)
      .setNotBefore(now - Number(process.env.JWT_CLOCK_SKEW))
      .setExpirationTime(`${process.env.JWT_ACCESS_TTL}s`)
      .setJti(crypto.randomUUID())
      .sign(await this.privateKey);
    return jwt;
  }

  async verifyAccess(token: string) {
    return await jose.jwtVerify(token, await this.publicKey, {
      issuer: process.env.JWT_ISS!,
      audience: process.env.JWT_AUD!,
      algorithms: [process.env.JWK_ALGORITHM!],
      clockTolerance: Number(process.env.JWT_CLOCK_SKEW),
    });
  }

  generateRefresh(): { token: string; hash: string } {
    const token = crypto.randomUUID() + crypto.randomUUID();
    const hash = crypto
      .createHash(process.env.JWT_HASH_ALGORITHM!)
      .update(token)
      .digest('hex');
    return { token, hash };
  }
}
