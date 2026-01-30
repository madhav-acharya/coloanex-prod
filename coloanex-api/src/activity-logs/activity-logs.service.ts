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

  async getNotifications(
    userId: string,
    userRoles: string[],
    tenantId?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const isSuperAdmin = userRoles.includes('Super Admin');

    const whereClause: Prisma.ActivityLogWhereInput = isSuperAdmin
      ? {}
      : tenantId
        ? { tenantId }
        : { actorUserId: userId };

    const notifications = await this.prisma.activityLog.findMany({
      where: whereClause,
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
        readBy: {
          where: { userId },
          select: {
            id: true,
            readAt: true,
          },
        },
      },
    });

    return notifications.map((notification) => ({
      ...notification,
      isRead: notification.readBy.length > 0,
      readAt: notification.readBy[0]?.readAt,
    }));
  }

  async getUnreadCount(
    userId: string,
    userRoles: string[],
    tenantId?: string,
  ): Promise<number> {
    const isSuperAdmin = userRoles.includes('Super Admin');

    const whereClause: Prisma.ActivityLogWhereInput = isSuperAdmin
      ? {}
      : tenantId
        ? { tenantId }
        : { actorUserId: userId };

    return this.prisma.activityLog.count({
      where: {
        ...whereClause,
        readBy: {
          none: { userId },
        },
      },
    });
  }

  async markAsRead(activityLogId: string, userId: string) {
    return this.prisma.notificationRead.upsert({
      where: {
        activityLogId_userId: {
          activityLogId,
          userId,
        },
      },
      create: {
        activityLogId,
        userId,
      },
      update: {},
    });
  }

  async markAllAsRead(userId: string, userRoles: string[], tenantId?: string) {
    const isSuperAdmin = userRoles.includes('Super Admin');

    const whereClause: Prisma.ActivityLogWhereInput = isSuperAdmin
      ? {}
      : tenantId
        ? { tenantId }
        : { actorUserId: userId };

    const unreadActivities = await this.prisma.activityLog.findMany({
      where: {
        ...whereClause,
        readBy: {
          none: { userId },
        },
      },
      select: { id: true },
    });

    await this.prisma.notificationRead.createMany({
      data: unreadActivities.map((activity) => ({
        activityLogId: activity.id,
        userId,
      })),
      skipDuplicates: true,
    });

    return { count: unreadActivities.length };
  }

  async getLastUserActivity(userId: string): Promise<ActivityLog | null> {
    return this.prisma.activityLog.findFirst({
      where: {
        actorUserId: userId,
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<ActivityLog | null>;
  }
}
