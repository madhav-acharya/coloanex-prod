import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import type { Rule } from './entities/rule.entity';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class RulesService {
  constructor(private prisma: PrismaService) {}

  async create(createRuleDto: CreateRuleDto, user: JwtPayload): Promise<Rule> {
    const isSuperAdmin = user.roles?.includes('Super Admin');
    const tenantId = createRuleDto.tenantId || user.tenantId;

    if (!tenantId && !isSuperAdmin) {
      throw new ForbiddenException('Only tenant users can create rules');
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    return this.prisma.rule.create({
      data: {
        ...createRuleDto,
        tenantId: tenantId,
        loanLimits: createRuleDto.loanLimits as any,
        penaltyConfig: createRuleDto.penaltyConfig as any,
        paymentConfig: createRuleDto.paymentConfig as any,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    }) as unknown as Rule;
  }

  async findAll(user?: JwtPayload): Promise<Rule[]> {
    const where: any = {};

    // If user is a tenant user, show only their rules
    if (user?.tenantId) {
      where.tenantId = user.tenantId;
    } else {
      // For borrowers/public, show only publicly visible and active rules
      where.isPubliclyVisible = true;
      where.isActive = true;
    }

    return this.prisma.rule.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Rule[];
  }

  async findOne(id: string, user?: JwtPayload): Promise<Rule> {
    const rule = await this.prisma.rule.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    // Check access permissions
    if (user?.tenantId && rule.tenantId !== user.tenantId) {
      throw new ForbiddenException('You can only view your own rules');
    }

    if (!user?.tenantId && (!rule.isPubliclyVisible || !rule.isActive)) {
      throw new NotFoundException('Rule not found');
    }

    return rule as unknown as Rule;
  }

  async findByTenant(tenantId: string): Promise<Rule[]> {
    return this.prisma.rule.findMany({
      where: {
        tenantId,
        isActive: true,
        isPubliclyVisible: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Rule[];
  }

  async update(
    id: string,
    updateRuleDto: UpdateRuleDto,
    user: JwtPayload,
  ): Promise<Rule> {
    const rule = await this.prisma.rule.findUnique({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (rule.tenantId !== user.tenantId) {
      throw new ForbiddenException('You can only update your own rules');
    }

    return this.prisma.rule.update({
      where: { id },
      data: {
        ...updateRuleDto,
        loanLimits: updateRuleDto.loanLimits as any,
        penaltyConfig: updateRuleDto.penaltyConfig as any,
        paymentConfig: updateRuleDto.paymentConfig as any,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    }) as unknown as Rule;
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    const rule = await this.prisma.rule.findUnique({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (rule.tenantId !== user.tenantId) {
      throw new ForbiddenException('You can only delete your own rules');
    }

    await this.prisma.rule.delete({ where: { id } });
  }
}
