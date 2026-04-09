import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import type { Rule } from './entities/rule.entity';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class RulesService {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  private withBlockchainMeta<T extends Record<string, any>>(
    rule: T,
  ): T & {
    evmAddress: string | null;
    isOnChain: boolean;
    blockchainTxHash: string | null;
    blockchainData: Record<string, unknown> | null;
  } {
    const evmAddress = process.env.EVM_RULE_REGISTRY_ADDRESS ?? null;
    const blockchainTxHash = (rule as any).blockchainTxHash ?? null;
    const blockchainData =
      ((rule as any).blockchainData as
        | Record<string, unknown>
        | null
        | undefined) ?? null;

    return {
      ...rule,
      evmAddress,
      isOnChain: Boolean(evmAddress && (blockchainTxHash || rule.id)),
      blockchainTxHash,
      blockchainData,
    };
  }

  async create(createRuleDto: CreateRuleDto, user: JwtPayload): Promise<Rule> {
    const isSuperAdmin = user.roles?.includes('Super Admin');
    const tenantId = createRuleDto.tenantId || user.tenantId;

    if (!tenantId && !isSuperAdmin) {
      throw new ForbiddenException('Only tenant users can create rules');
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    const ruleId = createRuleDto.id || randomUUID();

    // If the client already provides an ID, it may have already recorded the
    // rule on-chain (web MetaMask flow). Avoid double-creating on-chain.
    const shouldRecordOnChain =
      this.blockchainService.isEnabled() && !createRuleDto.id;

    let blockchainTxHash: string | null =
      createRuleDto.blockchainTxHash || null;
    let blockchainData: Record<string, unknown> | null =
      (createRuleDto.blockchainData as Record<string, unknown>) || null;

    if (shouldRecordOnChain) {
      const tx = await this.blockchainService.recordRule(
        ruleId,
        createRuleDto.name,
        createRuleDto.ruleType,
        Math.round(createRuleDto.interestRate * 100),
        Number(createRuleDto.loanLimits.minAmount),
        Number(createRuleDto.loanLimits.maxAmount),
        Number(createRuleDto.loanLimits.minTermMonths),
        Number(createRuleDto.loanLimits.maxTermMonths),
        createRuleDto.isActive ?? true,
      );

      if (!tx) {
        throw new InternalServerErrorException(
          'Blockchain transaction failed. Cannot create rule without blockchain record.',
        );
      }

      blockchainTxHash = tx.txHash;
      blockchainData = tx as unknown as Record<string, unknown>;
    }

    const createdRule = (await this.prisma.rule.create({
      data: {
        ...createRuleDto,
        id: ruleId,
        tenantId: tenantId,
        loanLimits: createRuleDto.loanLimits as any,
        penaltyConfig: createRuleDto.penaltyConfig as any,
        paymentConfig: createRuleDto.paymentConfig as any,
        blockchainTxHash,
        blockchainData: blockchainData as any,
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
    })) as unknown as Rule;

    return this.withBlockchainMeta(createdRule as any) as unknown as Rule;
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

    const rules = await this.prisma.rule.findMany({
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
    });

    return rules.map((rule) =>
      this.withBlockchainMeta(rule as any),
    ) as unknown as Rule[];
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

    return this.withBlockchainMeta(rule as any) as unknown as Rule;
  }

  async findByTenant(tenantId: string): Promise<Rule[]> {
    const rules = await this.prisma.rule.findMany({
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
    });

    return rules.map((rule) =>
      this.withBlockchainMeta(rule as any),
    ) as unknown as Rule[];
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

    const nextLoanLimits = {
      ...(rule.loanLimits as Record<string, any>),
      ...(updateRuleDto.loanLimits || {}),
    };

    let blockchainTxHash: string | null =
      updateRuleDto.blockchainTxHash || null;
    let blockchainData: Record<string, unknown> | null =
      (updateRuleDto.blockchainData as Record<string, unknown>) || null;

    if (this.blockchainService.isEnabled()) {
      const tx = await this.blockchainService.updateRule(
        id,
        Math.round(
          Number(updateRuleDto.interestRate ?? rule.interestRate) * 100,
        ),
        Number(nextLoanLimits.minAmount),
        Number(nextLoanLimits.maxAmount),
        Number(nextLoanLimits.minTermMonths),
        Number(nextLoanLimits.maxTermMonths),
        updateRuleDto.isActive ?? rule.isActive,
      );

      if (!tx) {
        throw new InternalServerErrorException(
          'Blockchain update failed. Cannot update rule without blockchain record.',
        );
      }

      blockchainTxHash = tx.txHash;
      blockchainData = tx as unknown as Record<string, unknown>;
    }

    const updatedRule = (await this.prisma.rule.update({
      where: { id },
      data: {
        ...updateRuleDto,
        loanLimits: updateRuleDto.loanLimits as any,
        penaltyConfig: updateRuleDto.penaltyConfig as any,
        paymentConfig: updateRuleDto.paymentConfig as any,
        ...(blockchainTxHash ? { blockchainTxHash } : {}),
        ...(blockchainData ? { blockchainData: blockchainData as any } : {}),
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
    })) as unknown as Rule;

    return this.withBlockchainMeta(updatedRule as any) as unknown as Rule;
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    const rule = await this.prisma.rule.findUnique({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (rule.tenantId !== user.tenantId) {
      throw new ForbiddenException('You can only delete your own rules');
    }

    if (this.blockchainService.isEnabled()) {
      const tx = await this.blockchainService.deleteRule(id);
      if (!tx) {
        throw new InternalServerErrorException(
          'Failed to record rule deletion on blockchain',
        );
      }
    }

    await this.prisma.rule.delete({ where: { id } });
  }
}
