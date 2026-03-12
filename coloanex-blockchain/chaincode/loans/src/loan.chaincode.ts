import {
  Context,
  Contract,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import { LoanAsset, LoanStatus, LOAN_STATUS_TRANSITIONS } from "./types";

@Info({
  title: "LoanChaincode",
  description: "Loan lifecycle management on Hyperledger Fabric",
})
export class LoanChaincode extends Contract {
  constructor() {
    super("LoanChaincode");
  }

  @Transaction()
  async initLedger(ctx: Context): Promise<void> {
    console.log("LoanChaincode ledger initialized");
  }

  @Transaction()
  async createLoan(
    ctx: Context,
    id: string,
    borrowerId: string,
    tenantId: string,
    requestedAmount: string,
    purpose: string,
    collateralDetailsJson: string,
    requestedTermMonths: number,
  ): Promise<LoanAsset> {
    const exists = await this.loanExists(ctx, id);
    if (exists) {
      throw new Error(`Loan ${id} already exists`);
    }

    const now = this.txTime(ctx);
    const loan: LoanAsset = {
      docType: "loan",
      id,
      borrowerId,
      tenantId,
      requestedAmount,
      approvedAmount: null,
      purpose,
      collateralDetails: JSON.parse(collateralDetailsJson),
      requestedTermMonths,
      approvedTermMonths: null,
      status: "DRAFT",
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(loan)));
    ctx.stub.setEvent(
      "LoanCreated",
      Buffer.from(JSON.stringify({ id, borrowerId, tenantId })),
    );
    return loan;
  }

  @Transaction(false)
  @Returns("string")
  async getLoan(ctx: Context, id: string): Promise<string> {
    const loanBytes = await ctx.stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${id} does not exist`);
    }
    return loanBytes.toString();
  }

  @Transaction()
  async updateLoanStatus(
    ctx: Context,
    id: string,
    newStatus: LoanStatus,
    reason?: string,
  ): Promise<LoanAsset> {
    const loan = await this.fetchLoan(ctx, id);

    const validTransition = LOAN_STATUS_TRANSITIONS.find(
      (t) => t.to === newStatus && t.from.includes(loan.status),
    );

    if (!validTransition) {
      throw new Error(
        `Invalid status transition from ${loan.status} to ${newStatus}`,
      );
    }

    loan.status = newStatus;
    loan.updatedAt = this.txTime(ctx);

    if (newStatus === "REJECTED" && reason) {
      loan.rejectionReason = reason;
    }

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(loan)));
    ctx.stub.setEvent(
      "LoanStatusUpdated",
      Buffer.from(JSON.stringify({ id, status: newStatus })),
    );
    return loan;
  }

  @Transaction()
  async approveLoan(
    ctx: Context,
    id: string,
    approvedAmount: string,
    approvedTermMonths: number,
  ): Promise<LoanAsset> {
    const loan = await this.fetchLoan(ctx, id);

    if (loan.status !== "UNDER_REVIEW") {
      throw new Error(`Loan ${id} must be UNDER_REVIEW to be approved`);
    }

    loan.approvedAmount = approvedAmount;
    loan.approvedTermMonths = approvedTermMonths;
    loan.status = "APPROVED";
    loan.updatedAt = this.txTime(ctx);

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(loan)));
    ctx.stub.setEvent(
      "LoanApproved",
      Buffer.from(JSON.stringify({ id, approvedAmount })),
    );
    return loan;
  }

  @Transaction(false)
  @Returns("string")
  async queryLoansByTenant(ctx: Context, tenantId: string): Promise<string> {
    const query = {
      selector: {
        docType: "loan",
        tenantId,
      },
    };
    return this.runQuery(ctx, JSON.stringify(query));
  }

  @Transaction(false)
  @Returns("string")
  async queryLoansByBorrower(
    ctx: Context,
    borrowerId: string,
  ): Promise<string> {
    const query = {
      selector: {
        docType: "loan",
        borrowerId,
      },
    };
    return this.runQuery(ctx, JSON.stringify(query));
  }

  @Transaction(false)
  @Returns("string")
  async getLoanHistory(ctx: Context, id: string): Promise<string> {
    const results: unknown[] = [];
    const iterator = await ctx.stub.getHistoryForKey(id);

    while (true) {
      const { done, value } = await iterator.next();
      if (done || !value) break;

      results.push({
        txId: value.txId,
        timestamp: value.timestamp,
        isDelete: value.isDelete,
        value: value.value.toString(),
      });
    }

    await iterator.close();
    return JSON.stringify(results);
  }

  @Transaction(false)
  @Returns("boolean")
  async loanExists(ctx: Context, id: string): Promise<boolean> {
    const loanBytes = await ctx.stub.getState(id);
    return !!loanBytes && loanBytes.length > 0;
  }

  private txTime(ctx: Context): string {
    const ts = ctx.stub.getTxTimestamp();
    return new Date(Number(ts.seconds) * 1000).toISOString();
  }

  private async fetchLoan(ctx: Context, id: string): Promise<LoanAsset> {
    const loanBytes = await ctx.stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${id} does not exist`);
    }
    return JSON.parse(loanBytes.toString()) as LoanAsset;
  }

  private async runQuery(ctx: Context, queryString: string): Promise<string> {
    const results: unknown[] = [];
    const iterator = await ctx.stub.getQueryResult(queryString);

    while (true) {
      const { done, value } = await iterator.next();
      if (done || !value) break;
      results.push(JSON.parse(value.value.toString()));
    }

    await iterator.close();
    return JSON.stringify(results);
  }
}
