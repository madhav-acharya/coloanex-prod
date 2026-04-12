import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as puppeteer from 'puppeteer';
import { PrismaService } from '../prisma.service';
import { CloudinaryUploadsService } from '../cloudinary-uploads/cloudinary-uploads.service';
import { MailService } from '../mail/mail.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TransactionOrchestratorService } from '../transaction-orchestrator/transaction-orchestrator.service';
import { SubscriptionResolverService } from '../transaction-orchestrator/subscription-resolver.service';
import { contractGeneratedTemplate } from '../mail/templates';
import {
  ActivityEntityType,
  ActivityAction,
} from '../activity-logs/entities/activity-log.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { DisburseContractDto } from './dto/disburse-contract.dto';
import { SignAndDisburseContractDto } from './dto/sign-and-disburse-contract.dto';
import type { Contract, Signature } from './entities/contract.entity';
import { ContractStatus } from './entities/contract.entity';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import {
  buildContractHtml,
  generateTermsAndConditions,
} from './templates/contract.template';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryUploadsService: CloudinaryUploadsService,
    private mailService: MailService,
    private activityLogsService: ActivityLogsService,
    private blockchainService: BlockchainService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly subscriptionResolver: SubscriptionResolverService,
  ) {}

  private resolvePlatform(user: JwtPayload): 'APP' | 'WEB' {
    return user.roles?.includes('Borrower') ? 'APP' : 'WEB';
  }

  private async generateContractNumber(tenantId: string): Promise<string> {
    const contractCount = await this.prisma.contract.count({
      where: { tenantId },
    });
    const nextSequence = contractCount + 1;
    const timestamp = Date.now().toString().slice(-6);
    return `CON-${tenantId.slice(0, 4).toUpperCase()}-${timestamp}-${nextSequence.toString().padStart(4, '0')}`;
  }

  private calculateEndDate(startDate: Date, termMonths: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + termMonths);
    return endDate;
  }

  private calculateInstallments(
    loanAmount: number,
    interestRate: number,
    termMonths: number,
    paymentFrequency: string,
  ): {
    installmentAmount: number;
    totalInstallments: number;
    totalAmountDue: number;
  } {
    const totalInterest = (loanAmount * interestRate * termMonths) / (12 * 100);
    const totalAmountDue = loanAmount + totalInterest;

    let totalInstallments: number;
    switch (paymentFrequency) {
      case 'WEEKLY':
        totalInstallments = Math.ceil((termMonths * 30) / 7);
        break;
      case 'MONTHLY':
        totalInstallments = termMonths;
        break;
      case 'QUARTERLY':
        totalInstallments = Math.ceil(termMonths / 3);
        break;
      default:
        totalInstallments = termMonths;
    }

    const installmentAmount = totalAmountDue / totalInstallments;

    return {
      installmentAmount: Math.round(installmentAmount * 100) / 100,
      totalInstallments,
      totalAmountDue: Math.round(totalAmountDue * 100) / 100,
    };
  }

  private async createPaymentSchedules(
    contractId: string,
    loanAmount: number,
    interestRate: number,
    termMonths: number,
    paymentFrequency: string,
    startDate: Date,
    db: Pick<PrismaService, 'paymentSchedule'> = this.prisma,
  ): Promise<void> {
    const { installmentAmount, totalInstallments, totalAmountDue } =
      this.calculateInstallments(
        loanAmount,
        interestRate,
        termMonths,
        paymentFrequency,
      );

    const totalInterest = (loanAmount * interestRate * termMonths) / (12 * 100);
    const principalPerInstallment =
      Math.round((loanAmount / totalInstallments) * 100) / 100;
    const interestPerInstallment =
      Math.round((totalInterest / totalInstallments) * 100) / 100;

    let totalPrincipalAllocated = 0;
    let totalInterestAllocated = 0;
    let totalAmountAllocated = 0;

    const schedules: any[] = [];

    for (let i = 1; i <= totalInstallments; i++) {
      let isLast = i === totalInstallments;
      let pAmt = isLast
        ? Math.max(0, loanAmount - totalPrincipalAllocated)
        : principalPerInstallment;
      let iAmt = isLast
        ? Math.max(0, totalInterest - totalInterestAllocated)
        : interestPerInstallment;
      let tAmt = isLast
        ? Math.max(0, totalAmountDue - totalAmountAllocated)
        : installmentAmount;

      pAmt = Math.round(pAmt * 100) / 100;
      iAmt = Math.round(iAmt * 100) / 100;
      tAmt = Math.round(tAmt * 100) / 100;

      let dueDate = new Date(startDate);
      if (paymentFrequency === 'WEEKLY') {
        dueDate.setDate(dueDate.getDate() + 7 * i);
      } else if (paymentFrequency === 'QUARTERLY') {
        dueDate.setMonth(dueDate.getMonth() + 3 * i);
      } else {
        dueDate.setMonth(dueDate.getMonth() + i);
      }

      schedules.push({
        contractId,
        installmentNumber: i,
        dueDate,
        principalAmount: pAmt,
        interestAmount: iAmt,
        totalAmount: tAmt,
        status: 'PENDING' as any,
      });

      totalPrincipalAllocated += pAmt;
      totalInterestAllocated += iAmt;
      totalAmountAllocated += tAmt;
    }

    await db.paymentSchedule.createMany({
      data: schedules,
    });
  }

  private async ensureDisbursementPaymentCompleted(
    contractId: string,
    transactionId: string,
  ) {
    const tx = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        contractId,
        type: 'DISBURSEMENT' as any,
      },
      select: { id: true, status: true },
    });

    if (!tx) {
      throw new BadRequestException(
        'Invalid disbursement transaction reference for this contract.',
      );
    }

    if (String(tx.status) !== 'COMPLETED') {
      throw new BadRequestException(
        'Disbursement payment is not completed yet. Please finish payment verification first.',
      );
    }

    return tx.id;
  }

  private async ensureContractActivatedState(
    contract: {
      id: string;
      loanId: string;
      loanAmount: any;
      interestRate: any;
      termMonths: number;
      paymentFrequency: string;
      startDate: Date;
    },
    db: Pick<PrismaService, 'paymentSchedule' | 'loan'> = this.prisma,
  ) {
    const existingSchedulesCount = await db.paymentSchedule.count({
      where: { contractId: contract.id },
    });

    if (existingSchedulesCount === 0) {
      await this.createPaymentSchedules(
        contract.id,
        Number(contract.loanAmount),
        Number(contract.interestRate),
        contract.termMonths,
        contract.paymentFrequency,
        new Date(contract.startDate),
        db,
      );
    }

    await db.loan.update({
      where: { id: contract.loanId },
      data: { status: 'LOAN_PROVIDED' as any },
    });
  }

  async create(
    createContractDto: CreateContractDto,
    user: JwtPayload,
  ): Promise<Contract> {
    if (!user.tenantId) {
      throw new ForbiddenException('Only tenant users can create contracts');
    }

    // Verify loan exists and belongs to tenant
    const loan = await this.prisma.loan.findUnique({
      where: { id: createContractDto.loanId },
      include: { borrower: true },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.tenantId !== user.tenantId) {
      throw new ForbiddenException(
        'You can only create contracts for your own loans',
      );
    }

    // Check if contract already exists for this loan
    const existingContract = await this.prisma.contract.findUnique({
      where: { loanId: createContractDto.loanId },
    });

    if (existingContract) {
      throw new BadRequestException('Contract already exists for this loan');
    }

    // Verify rule exists and belongs to tenant
    const rule = await this.prisma.rule.findUnique({
      where: { id: createContractDto.ruleId },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (rule.tenantId !== user.tenantId) {
      throw new ForbiddenException('You can only use your own rules');
    }

    // Use provided values or fall back to loan/rule values
    const loanAmount =
      createContractDto.loanAmount ||
      Number(loan.approvedAmount || loan.requestedAmount);
    const interestRate =
      createContractDto.interestRate || Number(rule.interestRate);

    // Calculate contract details
    const endDate = this.calculateEndDate(
      createContractDto.startDate,
      createContractDto.termMonths,
    );
    const { installmentAmount, totalInstallments, totalAmountDue } =
      this.calculateInstallments(
        loanAmount,
        interestRate,
        createContractDto.termMonths,
        createContractDto.paymentFrequency,
      );

    const contractNumber = await this.generateContractNumber(user.tenantId);
    const contractId = randomUUID();
    let blockchainData: any = createContractDto.blockchainData || null;
    let blockchainTxHash: string | null =
      createContractDto.blockchainTxHash || null;

    const orchestrationDecision =
      await this.transactionOrchestrator.orchestrate({
        userId: user.sub,
        tenantId: user.tenantId,
        transactionType: 'CONTRACT_CREATE',
        platform: this.resolvePlatform(user),
        userRoles: user.roles,
      });

    if (!orchestrationDecision.eligible) {
      throw new BadRequestException(
        orchestrationDecision.denialReason || 'Transaction blocked by policy',
      );
    }

    if (this.blockchainService.isEnabled() && !blockchainTxHash) {
      this.logger.log(
        `[Contract ${contractId}] Processing blockchain transaction...`,
      );
      const bcTx = await this.blockchainService.recordContract(
        contractId,
        createContractDto.loanId,
        Math.round(loanAmount * 100),
        Math.round(interestRate * 100),
        createContractDto.termMonths,
        Math.round(totalAmountDue * 100),
      );

      if (bcTx) {
        blockchainTxHash = bcTx.txHash;
        blockchainData = {
          txHash: bcTx.txHash,
          blockNumber: bcTx.blockNumber,
          gasUsed: bcTx.gasUsed,
          gasPriceGwei: bcTx.gasPriceGwei,
          gasFeeGwei: bcTx.gasFeeGwei,
          explorerUrl: bcTx.explorerUrl,
        };
        this.logger.log(
          `[Contract ${contractId}] Blockchain successful: tx=${bcTx.txHash}`,
        );
      } else {
        this.logger.warn(
          `[Contract ${contractId}] Blockchain transaction failed, continuing without blockchain record`,
        );
      }
    } else {
      this.logger.warn(
        `[Contract ${contractId}] Blockchain disabled, saving without chain record`,
      );
    }

    this.logger.log(`[Contract ${contractId}] Creating database record...`);
    const contract = await this.prisma.contract.create({
      data: {
        id: contractId,
        contractNumber,
        tenantId: user.tenantId,
        borrowerId: loan.borrowerId,
        loanId: createContractDto.loanId,
        ruleId: createContractDto.ruleId,
        status: ContractStatus.DRAFT,
        startDate: createContractDto.startDate,
        endDate,
        loanAmount,
        interestRate,
        termMonths: createContractDto.termMonths,
        paymentFrequency: createContractDto.paymentFrequency as any,
        installmentAmount,
        totalInstallments,
        totalAmountDue,
        totalAmountPaid: 0,
        outstandingBalance: totalAmountDue,
        termsAndConditions: createContractDto.termsAndConditions,
        blockchainTxHash,
        blockchainData,
      } as any,
      include: {
        tenant: {
          select: { id: true, name: true, logo: true },
        },
        borrower: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        loan: {
          select: { id: true, purpose: true },
        },
        rule: {
          select: { id: true, name: true, ruleType: true },
        },
      },
    });

    if (orchestrationDecision.gasPayer === 'PLATFORM') {
      await this.subscriptionResolver.consumeUsage(
        orchestrationDecision.subscriptionId,
      );
    }

    return contract as unknown as Contract;
  }

  async findAll(user: JwtPayload): Promise<Contract[]> {
    const where: any = {};

    if (user.tenantId) {
      where.tenantId = user.tenantId;
    } else {
      const borrowers = await this.prisma.borrower.findMany({
        where: { userId: user.sub },
        select: { id: true },
      });
      if (borrowers.length > 0) {
        where.borrowerId = { in: borrowers.map((b) => b.id) };
      }
    }

    return this.prisma.contract.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, logo: true },
        },
        borrower: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        loan: {
          select: { id: true, purpose: true },
        },
        rule: {
          select: { id: true, name: true, ruleType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Contract[];
  }

  async findOne(id: string, user: JwtPayload): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, name: true, logo: true },
        },
        borrower: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        loan: {
          select: { id: true, purpose: true },
        },
        rule: {
          select: { id: true, name: true, ruleType: true },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isTenantMember = user.tenantId === contract.tenantId;
    const isSuperAdmin = user.roles?.includes('Super Admin');
    if (!isTenantMember && !isSuperAdmin) {
      const borrower = await this.prisma.borrower.findFirst({
        where: { userId: user.sub, tenantId: contract.tenantId },
      });
      if (!borrower || borrower.id !== contract.borrowerId) {
        throw new ForbiddenException('You do not have access to this contract');
      }
    }

    return contract as unknown as Contract;
  }

  async update(
    id: string,
    updateContractDto: UpdateContractDto,
    user: JwtPayload,
  ): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({ where: { id } });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isSuperAdmin = user.roles?.includes('Super Admin');
    if (contract.tenantId !== user.tenantId && !isSuperAdmin) {
      throw new ForbiddenException('You can only update your own contracts');
    }

    const updateData: any = { ...updateContractDto };
    if (updateContractDto.blockchain_tx_hash) {
      updateData.blockchainTxHash = updateContractDto.blockchain_tx_hash;
      delete updateData.blockchain_tx_hash;
    }

    const updated = (await this.prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: { id: true, name: true, logo: true },
        },
        borrower: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        loan: {
          select: { id: true, purpose: true },
        },
        rule: {
          select: { id: true, name: true, ruleType: true },
        },
      },
    })) as unknown as Contract;

    if (updateContractDto.status && this.blockchainService.isEnabled()) {
      const orchestrationDecision =
        await this.transactionOrchestrator.orchestrate({
          userId: user.sub,
          tenantId: contract.tenantId,
          transactionType: 'CONTRACT_UPDATE',
          platform: this.resolvePlatform(user),
          userRoles: user.roles,
        });

      if (!orchestrationDecision.eligible) {
        throw new BadRequestException(
          orchestrationDecision.denialReason || 'Transaction blocked by policy',
        );
      }

      const existingBlockchainTxHash =
        (contract as any).blockchainTxHash || null;
      let resolvedBlockchainTxHash =
        updateContractDto.blockchain_tx_hash || existingBlockchainTxHash;

      if (
        orchestrationDecision.gasPayer !== 'USER' &&
        !updateContractDto.blockchain_tx_hash
      ) {
        this.logger.log(
          `[Contract ${id}] Updating blockchain status to ${updateContractDto.status}...`,
        );
        const bcTx = await this.blockchainService.updateContract(
          id,
          updateContractDto.status,
        );
        if (bcTx && bcTx.txHash) {
          resolvedBlockchainTxHash = bcTx.txHash;
          this.logger.log(
            `[Contract ${id}] Blockchain update successful: ${bcTx.txHash}`,
          );
        } else if (!resolvedBlockchainTxHash) {
          this.logger.error(`[Contract ${id}] Blockchain update failed`);
          throw new InternalServerErrorException(
            'Blockchain update failed. Cannot update contract status.',
          );
        }
      }

      if (resolvedBlockchainTxHash) {
        await this.prisma.contract.update({
          where: { id },
          data: { blockchainTxHash: resolvedBlockchainTxHash },
        });
      }

      if (orchestrationDecision.gasPayer === 'PLATFORM') {
        await this.subscriptionResolver.consumeUsage(
          orchestrationDecision.subscriptionId,
        );
      }
    }

    return updated;
  }

  async signContract(
    id: string,
    signContractDto: SignContractDto,
    user: JwtPayload,
  ): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        loan: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const borrower = await this.prisma.borrower.findFirst({
      where: { userId: user.sub, tenantId: contract.tenantId },
    });

    let signedBy: 'BORROWER' | 'TENANT';
    const isSuperAdmin = user.roles?.includes('Super Admin');
    if (user.tenantId === contract.tenantId || isSuperAdmin) {
      signedBy = 'TENANT';
    } else if (borrower && borrower.id === contract.borrowerId) {
      signedBy = 'BORROWER';
    } else {
      throw new ForbiddenException(
        'You do not have permission to sign this contract',
      );
    }

    const existingSignatures =
      (contract.signatures as any as Signature[]) || [];
    if (existingSignatures.some((s) => s.signedBy === signedBy)) {
      throw new BadRequestException(
        `${signedBy === 'BORROWER' ? 'Borrower' : 'Tenant'} has already signed this contract`,
      );
    }

    if (signedBy === 'TENANT') {
      if (!existingSignatures.some((s) => s.signedBy === 'BORROWER')) {
        throw new BadRequestException(
          'Borrower must sign the contract before the lender can sign',
        );
      }
    }

    let resolvedSignTxHash = signContractDto.blockchainTxHash;
    let mergedBlockchainData: Record<string, unknown> = {
      ...(((contract as any).blockchainData as Record<string, unknown>) || {}),
      ...((signContractDto.blockchainData as Record<string, unknown>) || {}),
    };
    let shouldConsumeSubscriptionUsage = false;

    if (this.blockchainService.isEnabled()) {
      const orchestrationDecision =
        await this.transactionOrchestrator.orchestrate({
          userId: user.sub,
          tenantId: contract.tenantId,
          transactionType: 'CONTRACT_SIGN',
          platform: this.resolvePlatform(user),
          userRoles: user.roles,
        });

      if (!orchestrationDecision.eligible) {
        throw new BadRequestException(
          orchestrationDecision.denialReason || 'Transaction blocked by policy',
        );
      }

      const existingSignTxHash =
        (mergedBlockchainData.signTxHash as string | undefined) ||
        ((contract as any).blockchainTxHash as string | undefined) ||
        null;
      const hasClientBlockchainRecord =
        Boolean(signContractDto.blockchainTxHash) ||
        Boolean(signContractDto.blockchainData);

      resolvedSignTxHash =
        resolvedSignTxHash || existingSignTxHash || undefined;

      if (
        orchestrationDecision.gasPayer === 'USER' &&
        !hasClientBlockchainRecord &&
        !resolvedSignTxHash
      ) {
        throw new BadRequestException(
          'USER_WALLET contract signing requires wallet-signed transaction hash.',
        );
      }

      if (
        orchestrationDecision.gasPayer !== 'USER' &&
        !hasClientBlockchainRecord &&
        !resolvedSignTxHash
      ) {
        this.logger.log(
          `[Contract ${id}] Processing blockchain contract signing...`,
        );
        const signBcTx = await this.blockchainService.signContract(id);

        if (!signBcTx) {
          this.logger.error(`[Contract ${id}] Blockchain signing failed`);
          throw new BadRequestException(
            'Blockchain signing failed. Cannot complete contract signing without blockchain record.',
          );
        }

        resolvedSignTxHash = signBcTx.txHash;
        mergedBlockchainData = {
          ...mergedBlockchainData,
          signTxHash: signBcTx.txHash,
          signBlockNumber: signBcTx.blockNumber,
          signGasFeeGwei: signBcTx.gasFeeGwei,
          signExplorerUrl: signBcTx.explorerUrl,
        };
      }

      if (resolvedSignTxHash) {
        mergedBlockchainData = {
          ...mergedBlockchainData,
          signTxHash: resolvedSignTxHash,
        };
      }

      shouldConsumeSubscriptionUsage =
        orchestrationDecision.gasPayer === 'PLATFORM';

      if (shouldConsumeSubscriptionUsage) {
        await this.subscriptionResolver.consumeUsage(
          orchestrationDecision.subscriptionId,
        );
      }
    }

    const newSignature: Signature = {
      signedBy,
      signature: signContractDto.signature,
      signedAt: new Date(),
      ipAddress: signContractDto.ipAddress,
    };

    const signatures = [...existingSignatures, newSignature];

    const hasBorrowerSignature = signatures.some(
      (s) => s.signedBy === 'BORROWER',
    );
    const hasTenantSignature = signatures.some((s) => s.signedBy === 'TENANT');
    const newStatus =
      hasBorrowerSignature && hasTenantSignature
        ? ContractStatus.SIGNED
        : contract.status === ContractStatus.GENERATED
          ? ContractStatus.GENERATED
          : contract.status;

    const updatedContract = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id },
        data: {
          signatures: signatures as any,
          status: newStatus as any,
          signedAt:
            hasBorrowerSignature && hasTenantSignature ? new Date() : undefined,
          ...(resolvedSignTxHash
            ? { blockchainTxHash: resolvedSignTxHash }
            : {}),
          ...(Object.keys(mergedBlockchainData).length > 0
            ? { blockchainData: mergedBlockchainData as any }
            : {}),
        },
        include: {
          tenant: {
            select: { id: true, name: true, logo: true },
          },
          borrower: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          loan: {
            select: { id: true, purpose: true },
          },
          rule: {
            select: { id: true, name: true, ruleType: true },
          },
        },
      });

      if (hasBorrowerSignature && hasTenantSignature) {
        await tx.loan.update({
          where: { id: contract.loanId },
          data: {
            status: 'CONTRACT_SIGNED' as any,
          },
        });
      }

      return updated;
    });

    return updatedContract as unknown as Contract;
  }

  async signAndDisburse(
    id: string,
    dto: SignAndDisburseContractDto,
    user: JwtPayload,
  ): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { loan: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isSuperAdmin = user.roles?.includes('Super Admin');
    if (contract.tenantId !== user.tenantId && !isSuperAdmin) {
      throw new ForbiddenException(
        'Only tenant members can sign and disburse this contract',
      );
    }

    if (
      ![
        ContractStatus.GENERATED,
        ContractStatus.SIGNED,
        ContractStatus.ACTIVE,
      ].includes(contract.status as ContractStatus)
    ) {
      throw new BadRequestException(
        'Contract must be GENERATED, SIGNED, or ACTIVE to complete sign and disburse',
      );
    }

    const paymentRequiredMethods = ['ESEWA', 'KHALTI', 'FONEPAY'];
    const existingDisbursementTxId = (contract as any)?.disbursementInfo
      ?.transactionId as string | undefined;
    const resolvedDisbursementTxId =
      dto.transactionId || existingDisbursementTxId;

    if (
      paymentRequiredMethods.includes(dto.method) &&
      !resolvedDisbursementTxId
    ) {
      throw new BadRequestException(
        'Disbursement payment must be completed before sign and disburse.',
      );
    }

    if (resolvedDisbursementTxId) {
      await this.ensureDisbursementPaymentCompleted(
        id,
        resolvedDisbursementTxId,
      );
    }

    const existingSigs = (contract.signatures as any as Signature[]) || [];

    if (!existingSigs.some((s) => s.signedBy === 'BORROWER')) {
      throw new BadRequestException(
        'Borrower must sign the contract before the lender can sign',
      );
    }

    const tenantAlreadySigned = existingSigs.some(
      (s) => s.signedBy === 'TENANT',
    );
    const signatures = tenantAlreadySigned
      ? existingSigs
      : [
          ...existingSigs,
          {
            signedBy: 'TENANT',
            signature: dto.signature,
            signedAt: new Date(),
          } as Signature,
        ];

    const disbursementInfo = {
      method: dto.method,
      accountNumber: dto.accountNumber,
      accountName: dto.accountName,
      disbursedAt: new Date(),
      transactionId: resolvedDisbursementTxId,
      status: 'COMPLETED',
    };

    const mergedBlockchainData = {
      ...(((contract as any).blockchainData as Record<string, unknown>) || {}),
      ...((dto.blockchainData as Record<string, unknown>) || {}),
      ...(dto.blockchainTxHash
        ? { signAndDisburseTxHash: dto.blockchainTxHash }
        : {}),
    };

    const updatedContract = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id },
        data: {
          signatures: signatures as any,
          status: ContractStatus.ACTIVE,
          signedAt: new Date(),
          disbursementInfo: disbursementInfo as any,
          ...(dto.blockchainTxHash
            ? { blockchainTxHash: dto.blockchainTxHash }
            : {}),
          ...(Object.keys(mergedBlockchainData).length > 0
            ? { blockchainData: mergedBlockchainData as any }
            : {}),
        },
        include: {
          tenant: { select: { id: true, name: true, logo: true } },
          borrower: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
          loan: { select: { id: true, purpose: true } },
          rule: { select: { id: true, name: true, ruleType: true } },
        },
      });

      await this.ensureContractActivatedState(
        {
          id,
          loanId: contract.loanId,
          loanAmount: contract.loanAmount,
          interestRate: contract.interestRate,
          termMonths: contract.termMonths,
          paymentFrequency: contract.paymentFrequency,
          startDate: new Date(contract.startDate),
        },
        tx as any,
      );

      return updated;
    });

    return updatedContract as unknown as Contract;
  }

  async disburse(
    id: string,
    disburseContractDto: DisburseContractDto,
    user: JwtPayload,
  ): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        loan: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isSuperAdmin = user.roles?.includes('Super Admin');
    if (contract.tenantId !== user.tenantId && !isSuperAdmin) {
      throw new ForbiddenException('Only tenant can disburse the loan');
    }

    if (
      ![ContractStatus.SIGNED, ContractStatus.ACTIVE].includes(
        contract.status as ContractStatus,
      )
    ) {
      throw new BadRequestException('Contract must be SIGNED to disburse');
    }

    const paymentRequiredMethods = ['ESEWA', 'KHALTI', 'FONEPAY'];
    const existingDisbursementTxId = (contract as any)?.disbursementInfo
      ?.transactionId as string | undefined;
    const resolvedDisbursementTxId =
      disburseContractDto.transactionId || existingDisbursementTxId;

    if (
      paymentRequiredMethods.includes(disburseContractDto.method) &&
      !resolvedDisbursementTxId
    ) {
      throw new BadRequestException(
        'Disbursement payment must be completed before disbursement.',
      );
    }

    if (resolvedDisbursementTxId) {
      await this.ensureDisbursementPaymentCompleted(
        id,
        resolvedDisbursementTxId,
      );
    }

    const disbursementInfo = {
      method: disburseContractDto.method,
      accountNumber: disburseContractDto.accountNumber,
      accountName: disburseContractDto.accountName,
      disbursedAt: new Date(),
      transactionId: resolvedDisbursementTxId,
      status: 'COMPLETED',
    };

    const updatedContract = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id },
        data: {
          disbursementInfo: disbursementInfo as any,
          status: ContractStatus.ACTIVE,
        },
        include: {
          tenant: {
            select: { id: true, name: true, logo: true },
          },
          borrower: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          loan: {
            select: { id: true, purpose: true },
          },
          rule: {
            select: { id: true, name: true, ruleType: true },
          },
        },
      });

      await this.ensureContractActivatedState(
        {
          id,
          loanId: contract.loanId,
          loanAmount: contract.loanAmount,
          interestRate: contract.interestRate,
          termMonths: contract.termMonths,
          paymentFrequency: contract.paymentFrequency,
          startDate: new Date(contract.startDate),
        },
        tx as any,
      );

      return updated;
    });

    return updatedContract as unknown as Contract;
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    const contract = await this.prisma.contract.findUnique({ where: { id } });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isSuperAdmin = user.roles?.includes('Super Admin');
    if (contract.tenantId !== user.tenantId && !isSuperAdmin) {
      throw new ForbiddenException('You can only delete your own contracts');
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Only draft contracts can be deleted');
    }

    if (this.blockchainService.isEnabled()) {
      const orchestrationDecision =
        await this.transactionOrchestrator.orchestrate({
          userId: user.sub,
          tenantId: contract.tenantId,
          transactionType: 'CONTRACT_DELETE',
          platform: this.resolvePlatform(user),
          userRoles: user.roles,
        });

      if (!orchestrationDecision.eligible) {
        throw new BadRequestException(
          orchestrationDecision.denialReason || 'Transaction blocked by policy',
        );
      }

      if (orchestrationDecision.gasPayer !== 'USER') {
        const bcTx = await this.blockchainService.deleteContract(id);

        if (!bcTx) {
          throw new InternalServerErrorException(
            'Failed to record contract deletion on blockchain',
          );
        }
      }

      if (orchestrationDecision.gasPayer === 'PLATFORM') {
        await this.subscriptionResolver.consumeUsage(
          orchestrationDecision.subscriptionId,
        );
      }
    }

    await this.prisma.contract.delete({ where: { id } });
  }

  async generateFromLoanApproval(
    loanId: string,
    ruleId: string,
    approvedAmount: number,
    approvedTermMonths: number,
    tenantId: string,
    actor: JwtPayload,
  ): Promise<Contract> {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        tenant: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    const existingContract = await this.prisma.contract.findUnique({
      where: { loanId },
    });

    if (existingContract) {
      throw new BadRequestException('Contract already exists for this loan');
    }

    const rule = await this.prisma.rule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, approvedTermMonths);
    const interestRate = Number(rule.interestRate);
    const paymentFrequency: string =
      (rule.paymentConfig as any)?.allowedFrequencies?.[0] || 'MONTHLY';

    const { installmentAmount, totalInstallments, totalAmountDue } =
      this.calculateInstallments(
        approvedAmount,
        interestRate,
        approvedTermMonths,
        paymentFrequency,
      );

    const termsAndConditions = generateTermsAndConditions(
      loan.tenant.name,
      loan.borrower.user.fullName,
      approvedAmount,
      interestRate,
      approvedTermMonths,
      rule,
    );

    const contractNumber = await this.generateContractNumber(loan.tenantId);
    const contractId = randomUUID();
    let blockchain_data: any = null;
    let orchestrationDecision:
      | Awaited<ReturnType<TransactionOrchestratorService['orchestrate']>>
      | undefined;

    if (this.blockchainService.isEnabled()) {
      orchestrationDecision = await this.transactionOrchestrator.orchestrate({
        userId: actor.sub,
        tenantId: loan.tenantId,
        transactionType: 'CONTRACT_CREATE',
        platform: this.resolvePlatform(actor),
        userRoles: actor.roles,
      });

      if (!orchestrationDecision.eligible) {
        throw new BadRequestException(
          orchestrationDecision.denialReason || 'Transaction blocked by policy',
        );
      }
    }

    const bcTx = await this.blockchainService.recordContract(
      contractId,
      loanId,
      Math.round(approvedAmount * 100),
      Math.round(interestRate * 100),
      approvedTermMonths,
      Math.round(totalAmountDue * 100),
    );
    if (bcTx) {
      blockchain_data = {
        txHash: bcTx.txHash,
        blockNumber: bcTx.blockNumber,
        gasFeeGwei: bcTx.gasFeeGwei,
        explorerUrl: bcTx.explorerUrl,
      };
    } else {
      this.logger.warn(
        `[generateFromLoanApproval] blockchain unavailable — contract ${contractId} saved without chain record`,
      );
    }

    const contract = await this.prisma.contract.create({
      data: {
        id: contractId,
        contractNumber,
        tenantId: loan.tenantId,
        borrowerId: loan.borrowerId,
        loanId,
        ruleId,
        status: ContractStatus.DRAFT,
        startDate,
        endDate,
        loanAmount: approvedAmount,
        interestRate,
        termMonths: approvedTermMonths,
        paymentFrequency: paymentFrequency as any,
        installmentAmount,
        totalInstallments,
        totalAmountDue,
        totalAmountPaid: 0,
        outstandingBalance: totalAmountDue,
        termsAndConditions,
        blockchainData: blockchain_data,
        blockchainTxHash: bcTx?.txHash || null,
      } as any,
      include: {
        tenant: {
          select: { id: true, name: true, logo: true },
        },
        borrower: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        loan: {
          select: { id: true, purpose: true },
        },
        rule: {
          select: { id: true, name: true, ruleType: true },
        },
      },
    });

    if (orchestrationDecision) {
      if (orchestrationDecision.gasPayer === 'PLATFORM') {
        await this.subscriptionResolver.consumeUsage(
          orchestrationDecision.subscriptionId,
        );
      }
    }

    return contract as unknown as Contract;
  }

  async generateContractPdf(id: string, user: JwtPayload): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        tenant: true,
        borrower: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        loan: {
          select: { id: true, purpose: true },
        },
        rule: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isSuperAdmin = user.roles?.includes('Super Admin');
    if (user.tenantId && contract.tenantId !== user.tenantId && !isSuperAdmin) {
      throw new ForbiddenException(
        'You can only generate PDFs for your own contracts',
      );
    }

    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.GENERATED
    ) {
      throw new BadRequestException(
        'Contract PDF can only be generated for DRAFT or GENERATED contracts',
      );
    }

    const html = buildContractHtml(
      contract.tenant,
      contract.borrower.user,
      Number(contract.loanAmount),
      Number(contract.interestRate),
      contract.termMonths,
      Number(contract.installmentAmount),
      contract.totalInstallments,
      Number(contract.totalAmountDue),
      new Date(contract.startDate),
      new Date(contract.endDate),
      contract.rule,
      contract.termsAndConditions,
      contract.paymentFrequency,
      contract.contractNumber,
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    await browser.close();

    const uploadResult = await this.cloudinaryUploadsService.uploadBuffer(
      Buffer.from(pdfBuffer),
      {
        folder: 'coloanex/contracts',
        filename: contract.contractNumber,
      },
    );

    let blockchainTxHash: string | null = null;
    if (this.blockchainService.isEnabled()) {
      const orchestrationDecision =
        await this.transactionOrchestrator.orchestrate({
          userId: user.sub,
          tenantId: contract.tenantId,
          transactionType: 'CONTRACT_UPDATE',
          platform: this.resolvePlatform(user),
          userRoles: user.roles,
        });

      if (!orchestrationDecision.eligible) {
        throw new BadRequestException(
          orchestrationDecision.denialReason || 'Transaction blocked by policy',
        );
      }

      this.logger.log(
        `[Contract ${id}] Updating blockchain status to GENERATED...`,
      );
      const bcTx = await this.blockchainService.updateContract(id, 'GENERATED');
      if (bcTx?.txHash) {
        blockchainTxHash = bcTx.txHash;
        this.logger.log(
          `[Contract ${id}] Blockchain update successful: ${bcTx.txHash}`,
        );
      } else {
        this.logger.warn(
          `[Contract ${id}] Blockchain update failed, continuing without blockchain record`,
        );
      }

      await this.subscriptionResolver.consumeUsage(
        orchestrationDecision.subscriptionId,
      );
    }

    const updatedContract = await this.prisma.contract.update({
      where: { id },
      data: {
        contractPdfUrl: uploadResult.secure_url,
        status: ContractStatus.GENERATED,
        blockchainTxHash,
      },
      include: {
        tenant: {
          select: { id: true, name: true, logo: true },
        },
        borrower: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        loan: {
          select: { id: true, purpose: true },
        },
        rule: {
          select: { id: true, name: true, ruleType: true },
        },
      },
    });

    await this.prisma.loan.update({
      where: { id: contract.loanId },
      data: { status: 'CONTRACT_GENERATED' as any },
    });

    // Notify borrower that contract is ready to sign
    try {
      await this.activityLogsService.create({
        actorUserId: updatedContract.borrower.user.id,
        tenantId: updatedContract.tenantId,
        entityType: ActivityEntityType.CONTRACT,
        entityId: updatedContract.id,
        action: ActivityAction.CONTRACT_SIGN,
        description: `Your contract ${updatedContract.contractNumber} has been generated by ${updatedContract.tenant.name}. Please review and sign it to proceed.`,
      });
    } catch (err) {}

    // Send contract-generated email to borrower
    try {
      await this.mailService.sendMail(
        {
          to: updatedContract.borrower.user.email,
          subject: `Contract Ready to Sign – ${updatedContract.tenant.name}`,
          html: contractGeneratedTemplate({
            tenantName: updatedContract.tenant.name,
            tenantLogo: updatedContract.tenant.logo || undefined,
            userName: updatedContract.borrower.user.fullName,
            contractNumber: updatedContract.contractNumber,
            loanAmount: `$${Number(updatedContract.loanAmount).toLocaleString()}`,
            interestRate: `${Number(updatedContract.interestRate)}%`,
            termMonths: updatedContract.termMonths,
            contractPdfUrl: updatedContract.contractPdfUrl || undefined,
            signUrl: `${process.env.APP_URL || 'https://app.example.com'}/contracts`,
            generatedDate: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
            tenantPrimaryColor:
              (updatedContract.tenant as any).primaryColor || undefined,
            tenantWebsite: (updatedContract.tenant as any).website || undefined,
          }),
        },
        updatedContract.tenantId,
      );
    } catch (err) {
      this.logger.error('Failed to send contract generated email:', err);
    }

    return updatedContract as unknown as Contract;
  }

  async reportContract(
    id: string,
    reportReason: string,
    user: JwtPayload,
  ): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const borrower = await this.prisma.borrower.findFirst({
      where: { userId: user.sub, tenantId: contract.tenantId },
    });

    if (!borrower || borrower.id !== contract.borrowerId) {
      throw new ForbiddenException('Only the borrower can report a contract');
    }

    const reported = await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.REPORTED,
        reportReason,
      },
      include: {
        tenant: {
          select: { id: true, name: true, logo: true },
        },
        borrower: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        loan: {
          select: { id: true, purpose: true },
        },
        rule: {
          select: { id: true, name: true, ruleType: true },
        },
      },
    });

    return reported as unknown as Contract;
  }
}
