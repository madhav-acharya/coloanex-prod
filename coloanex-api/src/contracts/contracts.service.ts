import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { PrismaService } from '../prisma.service';
import { CloudinaryUploadsService } from '../cloudinary-uploads/cloudinary-uploads.service';
import { MailService } from '../mail/mail.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
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
  ) {}

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

    const contract = await this.prisma.contract.create({
      data: {
        contractNumber: await this.generateContractNumber(user.tenantId),
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

    return this.prisma.contract.update({
      where: { id },
      data: updateContractDto,
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
    }) as unknown as Contract;
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

    const signatures = (contract.signatures as any as Signature[]) || [];

    if (signedBy === 'TENANT') {
      if (!signatures.some((s) => s.signedBy === 'BORROWER')) {
        throw new BadRequestException(
          'Borrower must sign the contract before the lender can sign',
        );
      }
    }
    const newSignature: Signature = {
      signedBy,
      signature: signContractDto.signature,
      signedAt: new Date(),
      ipAddress: signContractDto.ipAddress,
    };

    signatures.push(newSignature);

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

    const updatedContract = await this.prisma.contract.update({
      where: { id },
      data: {
        signatures: signatures as any,
        status: newStatus as any,
        signedAt:
          hasBorrowerSignature && hasTenantSignature ? new Date() : undefined,
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
      }
    });

    if (hasBorrowerSignature && hasTenantSignature) {
      await this.prisma.loan.update({
        where: { id: contract.loanId },
        data: {
          status: 'CONTRACT_SIGNED' as any,
        },
      });
    }

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

    if (contract.status !== ContractStatus.GENERATED) {
      throw new BadRequestException(
        'Contract must be in GENERATED status to sign and disburse',
      );
    }

    const existingSigs = (contract.signatures as any as Signature[]) || [];

    if (!existingSigs.some((s) => s.signedBy === 'BORROWER')) {
      throw new BadRequestException(
        'Borrower must sign the contract before the lender can sign',
      );
    }

    if (existingSigs.some((s) => s.signedBy === 'TENANT')) {
      throw new BadRequestException('Tenant has already signed this contract');
    }

    const tenantSignature: Signature = {
      signedBy: 'TENANT',
      signature: dto.signature,
      signedAt: new Date(),
    };

    const signatures = [...existingSigs, tenantSignature];

    const disbursementInfo = {
      method: dto.method,
      accountNumber: dto.accountNumber,
      accountName: dto.accountName,
      disbursedAt: new Date(),
      transactionId: dto.transactionId,
      status: 'COMPLETED',
    };

    const updatedContract = await this.prisma.contract.update({
      where: { id },
      data: {
        signatures: signatures as any,
        status: ContractStatus.ACTIVE,
        signedAt: new Date(),
        disbursementInfo: disbursementInfo as any,
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

    await this.prisma.loan.update({
      where: { id: contract.loanId },
      data: { status: 'LOAN_PROVIDED' as any },
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

    if (contract.status !== ContractStatus.SIGNED) {
      throw new BadRequestException('Contract must be SIGNED to disburse');
    }

    const disbursementInfo = {
      method: disburseContractDto.method,
      accountNumber: disburseContractDto.accountNumber,
      accountName: disburseContractDto.accountName,
      disbursedAt: new Date(),
      transactionId: disburseContractDto.transactionId,
      status: 'COMPLETED',
    };

    const updatedContract = await this.prisma.contract.update({
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

    await this.prisma.loan.update({
      where: { id: contract.loanId },
      data: {
        status: 'LOAN_PROVIDED' as any,
      },
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

    await this.prisma.contract.delete({ where: { id } });
  }

  async generateFromLoanApproval(
    loanId: string,
    ruleId: string,
    approvedAmount: number,
    approvedTermMonths: number,
    tenantId: string,
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

    const contract = await this.prisma.contract.create({
      data: {
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

    const updatedContract = await this.prisma.contract.update({
      where: { id },
      data: {
        contractPdfUrl: uploadResult.secure_url,
        status: ContractStatus.GENERATED,
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
