import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { DisburseContractDto } from './dto/disburse-contract.dto';
import type { Contract, Signature } from './entities/contract.entity';
import { ContractStatus } from './entities/contract.entity';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  private generateContractNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `CON-${timestamp}-${random}`;
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

    return this.prisma.contract.create({
      data: {
        contractNumber: this.generateContractNumber(),
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
    }) as unknown as Contract;
  }

  async findAll(user: JwtPayload): Promise<Contract[]> {
    const where: any = {};

    if (user.tenantId) {
      where.tenantId = user.tenantId;
    } else {
      // Borrower - find their contracts
      const borrower = await this.prisma.borrower.findFirst({
        where: { userId: user.sub },
      });
      if (borrower) {
        where.borrowerId = borrower.id;
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

    // Check access permissions
    const borrower = await this.prisma.borrower.findFirst({
      where: { userId: user.sub },
    });

    if (
      user.tenantId !== contract.tenantId &&
      (!borrower || borrower.id !== contract.borrowerId)
    ) {
      throw new ForbiddenException('You do not have access to this contract');
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

    if (contract.tenantId !== user.tenantId) {
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
      where: { userId: user.sub },
    });

    let signedBy: 'BORROWER' | 'TENANT';
    if (user.tenantId === contract.tenantId) {
      signedBy = 'TENANT';
    } else if (borrower && borrower.id === contract.borrowerId) {
      signedBy = 'BORROWER';
    } else {
      throw new ForbiddenException(
        'You do not have permission to sign this contract',
      );
    }

    const signatures = (contract.signatures as any as Signature[]) || [];
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
      },
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

    if (contract.tenantId !== user.tenantId) {
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

    if (contract.tenantId !== user.tenantId) {
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

    const termsAndConditions = this.generateTermsAndConditions(
      loan.tenant.name,
      loan.borrower.user.fullName,
      approvedAmount,
      interestRate,
      approvedTermMonths,
      rule,
    );

    const contractNumber = this.generateContractNumber();

    const contractPdfUrl = this.buildContractHtml(
      loan.tenant,
      loan.borrower.user,
      approvedAmount,
      interestRate,
      approvedTermMonths,
      installmentAmount,
      totalInstallments,
      totalAmountDue,
      startDate,
      endDate,
      rule,
      termsAndConditions,
      paymentFrequency,
      contractNumber,
    );

    const contract = await this.prisma.contract.create({
      data: {
        contractNumber,
        tenantId: loan.tenantId,
        borrowerId: loan.borrowerId,
        loanId,
        ruleId,
        status: ContractStatus.GENERATED,
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
        contractPdfUrl,
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

  private generateTermsAndConditions(
    tenantName: string,
    borrowerName: string,
    loanAmount: number,
    interestRate: number,
    termMonths: number,
    rule: any,
  ): string {
    const penaltyConfig = rule.penaltyConfig as any;
    const graceDays = penaltyConfig?.gracePeriodDays ?? 7;

    const penaltyClause =
      penaltyConfig?.penaltyType === 'PERCENTAGE'
        ? `${penaltyConfig.penaltyAmount}% of the overdue amount`
        : `NPR ${(penaltyConfig?.penaltyAmount ?? 0).toLocaleString()} (fixed)`;

    return `This Loan Agreement is entered into between ${tenantName} (the "Lender") and ${borrowerName} (the "Borrower"). The Lender agrees to provide a loan of NPR ${loanAmount.toLocaleString()} at an interest rate of ${interestRate}% per month for a term of ${termMonths} months. The Borrower agrees to repay the loan plus accrued interest in equal installments as specified in the payment schedule. Payments received after ${graceDays} days from the due date shall be subject to a late fee of ${penaltyClause} per month until the overdue amount is settled in full. The Borrower covenants to notify the Lender promptly of any event that may affect the ability to repay. The Borrower shall be liable for all reasonable costs and expenses incurred by the Lender in enforcing this Agreement, including legal fees. Prepayment of the outstanding principal is permitted at any time without penalty. This Agreement shall be governed by the applicable laws of the jurisdiction in which the Lender operates. Both parties acknowledge that they have read, understood, and voluntarily agree to be bound by these terms.`;
  }

  private buildContractHtml(
    tenant: any,
    borrower: any,
    loanAmount: number,
    interestRate: number,
    termMonths: number,
    installmentAmount: number,
    totalInstallments: number,
    totalAmountDue: number,
    startDate: Date,
    endDate: Date,
    rule: any,
    termsAndConditions: string,
    paymentFrequency: string,
    contractNumber: string,
  ): string {
    const penaltyConfig = rule.penaltyConfig as any;
    const graceDays = penaltyConfig?.gracePeriodDays ?? 7;
    const penaltyAmount =
      penaltyConfig?.penaltyType === 'PERCENTAGE'
        ? `${penaltyConfig.penaltyAmount}% of the overdue amount`
        : `NPR ${(penaltyConfig?.penaltyAmount ?? 0).toLocaleString()}`;

    const frequencyLabel: Record<string, string> = {
      WEEKLY: 'weekly',
      MONTHLY: 'monthly',
      QUARTERLY: 'quarterly',
    };
    const freqLabel = frequencyLabel[paymentFrequency] ?? 'monthly';
    const periodLabel: Record<string, string> = {
      WEEKLY: 'week',
      MONTHLY: 'month',
      QUARTERLY: 'quarter',
    };
    const periodWord = periodLabel[paymentFrequency] ?? 'month';

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    const numberToWords = (n: number): string => {
      const ones = [
        '',
        'one',
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        'ten',
        'eleven',
        'twelve',
        'thirteen',
        'fourteen',
        'fifteen',
        'sixteen',
        'seventeen',
        'eighteen',
        'nineteen',
      ];
      const tens = [
        '',
        '',
        'twenty',
        'thirty',
        'forty',
        'fifty',
        'sixty',
        'seventy',
        'eighty',
        'ninety',
      ];
      if (n < 20) return ones[n];
      if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
      return n.toString();
    };

    const installmentsInWords =
      numberToWords(totalInstallments) + ' (' + totalInstallments + ')';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loan Agreement - ${contractNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.75;
            color: #000;
            background: #fff;
        }
        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm 25mm 25mm 25mm;
            background: #fff;
        }
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6mm;
        }
        .contract-ref {
            font-size: 9pt;
            color: #000;
        }
        .logo-wrap img {
            height: 52px;
            width: auto;
        }
        .logo-placeholder {
            font-size: 10pt;
            font-weight: bold;
            text-align: right;
        }
        h1.doc-title {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8mm;
            letter-spacing: 0.5px;
        }
        p {
            text-align: justify;
            margin-bottom: 4mm;
        }
        .section-list {
            list-style-type: decimal;
            padding-left: 6mm;
            margin-bottom: 4mm;
        }
        .section-list li {
            text-align: justify;
            margin-bottom: 4mm;
            padding-left: 2mm;
        }
        .section-list li p {
            margin-top: 2mm;
            margin-bottom: 2mm;
        }
        strong.section-head {
            font-weight: bold;
        }
        u {
            text-decoration: underline;
        }
        .sig-area {
            margin-top: 14mm;
            page-break-inside: avoid;
        }
        .sig-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20mm;
            margin-top: 8mm;
        }
        .sig-block {
            border-top: 1px solid #000;
            padding-top: 3mm;
        }
        .sig-block p {
            margin-bottom: 1mm;
            text-align: left;
        }
        .sig-name {
            font-size: 11pt;
            font-weight: bold;
        }
        .sig-role {
            font-size: 9pt;
        }
        .sig-date {
            font-size: 9pt;
            margin-top: 2mm;
        }
        .sig-value {
            font-size: 11pt;
            margin-top: 1mm;
            min-height: 10mm;
            border-bottom: 1px solid #000;
            padding-bottom: 1mm;
        }
        .footer-note {
            margin-top: 10mm;
            font-size: 8.5pt;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 3mm;
        }
        @media print {
            body { background: #fff; }
            .page { width: 100%; padding: 15mm 20mm; }
        }
    </style>
</head>
<body>
<div class="page">

    <div class="top-bar">
        <div class="contract-ref">Contract No.: <strong>${contractNumber}</strong></div>
        <div class="logo-wrap">
            ${tenant.logo ? `<img src="${tenant.logo}" alt="${tenant.name}" />` : `<div class="logo-placeholder">${tenant.name}</div>`}
        </div>
    </div>

    <h1 class="doc-title">Loan Agreement</h1>

    <p>
        This Loan Agreement shall become effective on <u>${fmt(startDate)}</u> (the &ldquo;Execution Date&rdquo;) and is subject to the terms and conditions stated below by and between <u>${tenant.name}</u> (the &ldquo;Lender&rdquo;) and <u>${borrower.fullName}</u> (the &ldquo;Borrower&rdquo;), collectively referred to as the &ldquo;Parties&rdquo;.
    </p>

    <p>
        <strong>WHEREAS</strong> upon the terms and conditions outlined in this Agreement, the Parties wish to mutually acknowledge the debt that binds them under the Lender&rsquo;s amount to the Borrower.
    </p>

    <ol class="section-list">

        <li>
            <strong class="section-head">LOAN AMOUNT.</strong> Subject to the terms and conditions herein, the Lender agreed to loan NPR <u>${loanAmount.toLocaleString()}</u> (Nepalese Rupees) to the Borrower on <u>${fmt(startDate)}</u>.
        </li>

        <li>
            <strong class="section-head">PAYMENTS.</strong> The Borrower agrees to repay this amount to the Lender, with interest at the rate of <u>${interestRate}% per month</u> from the due amount.
            <p>
                The Borrower shall repay the loan in <u>${installmentsInWords} consecutive ${freqLabel} installments</u> of principal and interest of NPR <u>${installmentAmount.toLocaleString()}</u> each, on the first day of each <u>${periodWord}</u>, starting on <u>${fmt(startDate)}</u>, and continuing until <u>${fmt(endDate)}</u>. The total repayable amount is NPR <u>${totalAmountDue.toLocaleString()}</u>. The repayment shall be considered late if received by the Lender <u>seven (7) days</u> after its due date.
            </p>
        </li>

        <li>
            <strong class="section-head">PENALTY.</strong> If the Lender is not paid on the due date, the Borrower shall pay a late fee of <u>${penaltyAmount}</u> per ${periodWord} for every ${periodWord} or part thereof that the payment remains overdue, commencing after a grace period of <u>${graceDays} days</u> from the due date.
        </li>

        <li>
            <strong class="section-head">COVENANTS.</strong> The Borrower shall notify the Lender of any event of default, and the steps, if any, being taken to remedy it, promptly upon becoming aware of its occurrence.
            <p>
                The Borrower shall be liable for all costs, expenses, and expenditures incurred, including, and without limitation, the complete legal costs and fees of the Lender in enforcing this Agreement in the event of default.
            </p>
        </li>

        <li>
            <strong class="section-head">PREPAYMENT.</strong> The Borrower may prepay the outstanding principal balance in full or in part at any time without incurring any prepayment penalty.
        </li>

        <li>
            <strong class="section-head">DEFAULT.</strong> The Borrower shall be deemed in default if: (a) any payment is not received within <u>${graceDays} days</u> of the due date; (b) the Borrower breaches any representation, warranty, or covenant under this Agreement; or (c) the Borrower becomes insolvent or is subject to bankruptcy proceedings. Upon default, the entire unpaid balance, together with accrued interest and penalties, shall become immediately due and payable at the option of the Lender.
        </li>

        <li>
            <strong class="section-head">CONFIDENTIALITY.</strong> Both Parties agree to keep the terms of this Agreement confidential and shall not disclose the same to any third party without the prior written consent of the other Party, except as required by law.
        </li>

        <li>
            <strong class="section-head">GOVERNING LAW.</strong> This Agreement shall be governed by and construed in accordance with the applicable laws of the jurisdiction in which the Lender is registered. Any dispute arising out of or in connection with this Agreement shall be resolved through amicable negotiation between the Parties, failing which it shall be referred to the appropriate courts of competent jurisdiction.
        </li>

        <li>
            <strong class="section-head">ENTIRE AGREEMENT.</strong> This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, warranties, and understandings of the Parties with respect hereto. No amendment or modification of this Agreement shall be valid unless made in writing and duly signed by both Parties.
        </li>

    </ol>

    <p>
        By signing below, both Parties acknowledge that they have read, fully understood, and voluntarily agree to be bound by all the terms and conditions of this Agreement.
    </p>

    <div class="sig-area">
        <div class="sig-grid">
            <div class="sig-block">
                <p class="sig-role"><strong>LENDER</strong></p>
                <p class="sig-name">${tenant.name}</p>
                <p class="sig-value">&nbsp;</p>
                <p class="sig-role">Authorized Signatory</p>
                <p class="sig-date">Date: ___________________________</p>
            </div>
            <div class="sig-block">
                <p class="sig-role"><strong>BORROWER</strong></p>
                <p class="sig-name">${borrower.fullName}</p>
                <p class="sig-value">&nbsp;</p>
                <p class="sig-role">Borrower Signature</p>
                <p class="sig-date">Date: ___________________________</p>
            </div>
        </div>
    </div>

    <div class="footer-note">
        <p>This is a legally binding agreement. Please read carefully before signing. &nbsp;&bull;&nbsp; Generated on ${fmt(new Date())} &nbsp;&bull;&nbsp; ${tenant.name}</p>
    </div>

</div>
</body>
</html>`.trim();
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
      where: { userId: user.sub },
    });

    if (!borrower || borrower.id !== contract.borrowerId) {
      throw new ForbiddenException('Only the borrower can report a contract');
    }

    return this.prisma.contract.update({
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
    }) as unknown as Contract;
  }
}
