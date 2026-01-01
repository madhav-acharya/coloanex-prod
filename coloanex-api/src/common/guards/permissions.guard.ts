import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has Super Admin role - bypass all permission checks
    if (user.roles && user.roles.includes('Super Admin')) {
      return true;
    }

    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithPermissions) {
      throw new ForbiddenException('User not found');
    }

    const userRoles = userWithPermissions.roles.map((ur) => ur.role.name);
    if (userRoles.includes('Super Admin')) {
      return true;
    }

    const directPermissions = userWithPermissions.permissions.map(
      (up) => up.permission.name,
    );

    const rolePermissions = userWithPermissions.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );

    const allPermissions = [
      ...new Set([...directPermissions, ...rolePermissions]),
    ];

    if (requiredPermissions.includes('SELF_UPDATE')) {
      const httpRequest = context.switchToHttp().getRequest();
      const paramId = httpRequest.params?.id;
      if (paramId && paramId === user.sub) {
        return true;
      }
    }

    const hasPermission = requiredPermissions.some((permission) =>
      allPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
