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
    const paymentFrequency =
      (rule.paymentConfig as any)?.frequency || 'MONTHLY';

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

    const contractHtml = this.generateContractHtml(
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
    );

    const contract = await this.prisma.contract.create({
      data: {
        contractNumber: this.generateContractNumber(),
        tenantId,
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
        contractPdfUrl: contractHtml,
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
    const loanLimits = rule.loanLimits as any;

    return `
LOAN AGREEMENT

This Loan Agreement ("Agreement") is entered into as of the date of signing between:

LENDER: ${tenantName}
BORROWER: ${borrowerName}

1. LOAN DETAILS
   - Loan Amount: $${loanAmount.toLocaleString()}
   - Interest Rate: ${interestRate}% per annum
   - Loan Term: ${termMonths} months
   - Rule Type: ${rule.name}

2. REPAYMENT TERMS
   The Borrower agrees to repay the loan in ${termMonths} monthly installments. Each payment will include both principal and interest as calculated according to the payment schedule.

3. INTEREST
   Interest shall accrue at a rate of ${interestRate}% per annum on the outstanding principal balance.

4. LATE PAYMENT PENALTY
   ${penaltyConfig?.type === 'PERCENTAGE' ? `A penalty of ${penaltyConfig.value}% will be charged on overdue amounts.` : `A fixed penalty of $${penaltyConfig?.value} will be charged for late payments.`}

5. PREPAYMENT
   The Borrower may prepay the loan in full or in part at any time without penalty.

6. DEFAULT
   The loan will be considered in default if:
   - Payment is not received within ${penaltyConfig?.gracePeriod || 15} days of the due date
   - The Borrower breaches any other term of this Agreement

7. GOVERNING LAW
   This Agreement shall be governed by and construed in accordance with applicable laws.

8. ENTIRE AGREEMENT
   This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements and understandings.

By signing this Agreement, both parties acknowledge that they have read, understood, and agree to be bound by its terms and conditions.
    `.trim();
  }

  private generateContractHtml(
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
  ): string {
    const contractNumber = this.generateContractNumber();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loan Contract - ${contractNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #ddd;
            padding: 40px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 15px;
        }
        h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .contract-number {
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            color: #1e40af;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
        }
        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .party {
            padding: 15px;
            background: #f8fafc;
            border-left: 3px solid #2563eb;
        }
        .party-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .party-name {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            padding: 12px;
            background: #f8fafc;
            border-radius: 4px;
        }
        .info-label {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 4px;
        }
        .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
        }
        .terms-content {
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.8;
            padding: 20px;
            background: #f8fafc;
            border-radius: 4px;
        }
        .signature-section {
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        .signature-box {
            border-top: 2px solid #cbd5e1;
            padding-top: 10px;
        }
        .signature-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 5px;
        }
        .signature-name {
            font-weight: 600;
            color: #1e293b;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #64748b;
        }
        @media print {
            body {
                padding: 0;
            }
            .container {
                border: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${tenant.logo ? `<img src="${tenant.logo}" alt="${tenant.name}" class="logo">` : ''}
            <h1>LOAN AGREEMENT</h1>
            <div class="contract-number">Contract No: ${contractNumber}</div>
        </div>

        <div class="parties">
            <div class="party">
                <div class="party-label">Lender</div>
                <div class="party-name">${tenant.name}</div>
            </div>
            <div class="party">
                <div class="party-label">Borrower</div>
                <div class="party-name">${borrower.fullName}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Loan Summary</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Loan Amount</div>
                    <div class="info-value">$${loanAmount.toLocaleString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Interest Rate</div>
                    <div class="info-value">${interestRate}% per annum</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Loan Term</div>
                    <div class="info-value">${termMonths} months</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total Amount Due</div>
                    <div class="info-value">$${totalAmountDue.toLocaleString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Number of Installments</div>
                    <div class="info-value">${totalInstallments}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Installment Amount</div>
                    <div class="info-value">$${installmentAmount.toLocaleString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Start Date</div>
                    <div class="info-value">${startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">End Date</div>
                    <div class="info-value">${endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Terms and Conditions</div>
            <div class="terms-content">${termsAndConditions}</div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-label">Lender Signature</div>
                <div class="signature-name">${tenant.name}</div>
                <div style="margin-top: 5px; font-size: 12px; color: #64748b;">Date: _____________</div>
            </div>
            <div class="signature-box">
                <div class="signature-label">Borrower Signature</div>
                <div class="signature-name">${borrower.fullName}</div>
                <div style="margin-top: 5px; font-size: 12px; color: #64748b;">Date: _____________</div>
            </div>
        </div>

        <div class="footer">
            <p>This is a legally binding agreement. Please read carefully before signing.</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
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
