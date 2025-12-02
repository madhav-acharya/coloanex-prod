import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class SessionsService {
  private redis = new Redis(process.env.REDIS_URL!);

  async create(userId: string, ua: string, ip: string, ttlSec: number) {
    const sid = crypto.randomUUID();
    const familyId = crypto.randomUUID();
    await this.redis.hmset(`sess:${sid}`, {
      userId,
      familyId,
      revoked: '0',
      ua,
      ip,
    });
    await this.redis.expire(`sess:${sid}`, ttlSec);
    return { sid, familyId };
  }

  async storeRefresh(sid: string, plain: string, ttlSec: number) {
    const hash = await argon2.hash(plain, { type: argon2.argon2id });
    await this.redis.hset(`sess:${sid}`, 'refreshHash', hash);
    await this.redis.expire(`sess:${sid}`, ttlSec);
  }

  async rotateRefresh(sid: string, presented: string) {
    const key = `sess:${sid}`;
    const data = await this.redis.hgetall(key);
    if (!data || data.revoked === '1') return { valid: false, reuse: false };
    const ok = await argon2.verify(data.refreshHash, presented);
    if (!ok) {
      await this.revokeFamily(data.familyId);
      return { valid: false, reuse: true };
    }
    return { valid: true, reuse: false };
  }

  async revokeSession(sid: string) {
    await this.redis.hset(`sess:${sid}`, 'revoked', '1');
  }

  async revokeFamily(familyId: string) {
    await this.redis.sadd(`family:${familyId}`, '*');
  }

  async getSessionData(sid: string) {
    const key = `sess:${sid}`;
    const data = await this.redis.hgetall(key);
    if (!data || data.revoked === '1') return null;
    return data;
  }
}
