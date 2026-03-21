import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { SessionData } from '../interfaces/session.interface';

@Injectable()
export class RedisSessionService implements OnModuleInit {
  private client: RedisClientType;

  async onModuleInit() {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    this.client = createClient({
      url: process.env.REDIS_URL,
    });

    this.client.on('error', (err) => {});

    await this.client.connect();
  }

  async createSession(
    sessionData: Omit<SessionData, 'loginAt' | 'lastActivity'>,
  ): Promise<string> {
    const sessionId = uuidv4();
    const sessionKey = `session:${sessionId}`;

    const data: SessionData = {
      ...sessionData,
      loginAt: new Date(),
      lastActivity: new Date(),
    };

    await this.client.setEx(sessionKey, 60 * 60 * 24 * 7, JSON.stringify(data));

    await this.client.sAdd(`user:${sessionData.userId}:sessions`, sessionId);

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = `session:${sessionId}`;
    const data = await this.client.get(sessionKey);

    if (!data) {
      return null;
    }

    const sessionData = JSON.parse(data) as SessionData;
    sessionData.loginAt = new Date(sessionData.loginAt);
    sessionData.lastActivity = new Date(sessionData.lastActivity);

    return sessionData;
  }

  async updateLastActivity(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (!sessionData) {
      return;
    }

    sessionData.lastActivity = new Date();
    const sessionKey = `session:${sessionId}`;

    await this.client.setEx(
      sessionKey,
      60 * 60 * 24 * 7,
      JSON.stringify(sessionData),
    );
  }

  async revokeSession(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (!sessionData) {
      return;
    }

    const sessionKey = `session:${sessionId}`;
    await this.client.del(sessionKey);
    await this.client.sRem(`user:${sessionData.userId}:sessions`, sessionId);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `user:${userId}:sessions`;
    const sessionIds = await this.client.sMembers(userSessionsKey);

    if (sessionIds.length > 0) {
      const sessionKeys = sessionIds.map((id) => `session:${id}`);
      await this.client.del(sessionKeys);
      await this.client.del(userSessionsKey);
    }
  }

  async getUserActiveSessions(userId: string): Promise<SessionData[]> {
    const userSessionsKey = `user:${userId}:sessions`;
    const sessionIds = await this.client.sMembers(userSessionsKey);

    const sessions: SessionData[] = [];

    for (const sessionId of sessionIds) {
      const sessionData = await this.getSession(sessionId);
      if (sessionData) {
        sessions.push(sessionData);
      }
    }

    return sessions;
  }

  async cleanupExpiredSessions(): Promise<void> {
    const pattern = 'session:*';
    const sessionKeys: string[] = [];

    for await (const key of this.client.scanIterator({
      MATCH: pattern,
    })) {
      if (typeof key === 'string') {
        sessionKeys.push(key);
      }
    }

    for (const sessionKey of sessionKeys) {
      const ttl = await this.client.ttl(sessionKey);
      if (ttl <= 0) {
        await this.client.del(sessionKey);
      }
    }
  }
}
