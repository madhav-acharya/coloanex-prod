import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ActivityLog,
  ActivityEntityType,
  ActivityAction,
} from './entities/activity-log.entity';
import type { Prisma, $Enums } from '@prisma/client';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    actorUserId?: string;
    tenantId?: string;
    entityType: ActivityEntityType;
    entityId?: string;
    action: ActivityAction;
    description?: string;
    before?: unknown;
    after?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityLog> {
    return this.prisma.activityLog.create({
      data: {
        actorUserId: data.actorUserId ?? undefined,
        tenantId: data.tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action as $Enums.ActivityAction,
        description: data.description,
        before: data.before
          ? (data.before as Prisma.InputJsonValue)
          : undefined,
        after: data.after ? (data.after as Prisma.InputJsonValue) : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    }) as Promise<ActivityLog>;
  }

  async findByTenant(tenantId: string, limit: number = 50, offset: number = 0) {
    return this.prisma.activityLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        actorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findByUser(
    actorUserId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.prisma.activityLog.findMany({
      where: { actorUserId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findByEntity(entityType: ActivityEntityType, entityId: string) {
    return this.prisma.activityLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        actorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async logUserActivity(
    userId: string,
    action: ActivityAction,
    entityType: ActivityEntityType = ActivityEntityType.USER,
    entityId?: string,
    description?: string,
    before?: any,
    after?: any,
    ipAddress?: string,
    userAgent?: string,
    tenantId?: string,
  ): Promise<ActivityLog> {
    return this.create({
      actorUserId: userId,
      tenantId,
      entityType,
      entityId: entityId,
      action,
      description,
      before,
      after,
      ipAddress,
      userAgent,
    });
  }

  async logUserVisit(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    tenantId?: string,
  ): Promise<ActivityLog> {
    return this.logUserActivity(
      userId,
      ActivityAction.VISIT,
      ActivityEntityType.USER,
      userId,
      'User visited website',
      undefined,
      undefined,
      ipAddress,
      userAgent,
      tenantId,
    );
  }

  async logUserLeave(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    tenantId?: string,
  ): Promise<ActivityLog> {
    return this.logUserActivity(
      userId,
      ActivityAction.LEAVE,
      ActivityEntityType.USER,
      userId,
      'User left website',
      undefined,
      undefined,
      ipAddress,
      userAgent,
      tenantId,
    );
  }
}
