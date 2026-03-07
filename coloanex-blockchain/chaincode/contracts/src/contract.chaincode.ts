import {
  Context,
  Contract,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import {
  ContractAsset,
  ContractSignature,
  ContractStatus,
  CONTRACT_STATUS_TRANSITIONS,
} from "./types";

@Info({
  title: "ContractChaincode",
  description: "Loan contract lifecycle management on Hyperledger Fabric",
})
export class ContractChaincode extends Contract {
  constructor() {
    super("ContractChaincode");
  }

  @Transaction()
  async initLedger(ctx: Context): Promise<void> {
    console.log("ContractChaincode ledger initialized");
  }

  @Transaction()
  async createContract(
    ctx: Context,
    id: string,
    contractNumber: string,
    tenantId: string,
    borrowerId: string,
    loanId: string,
    ruleId: string,
    startDate: string,
    endDate: string,
    loanAmount: string,
    interestRate: string,
    termMonths: number,
    paymentFrequency: string,
    installmentAmount: string,
    totalInstallments: number,
    totalAmountDue: string,
    termsAndConditions: string,
  ): Promise<ContractAsset> {
    const exists = await this.contractExists(ctx, id);
    if (exists) {
      throw new Error(`Contract ${id} already exists`);
    }

    const contract: ContractAsset = {
      docType: "contract",
      id,
      contractNumber,
      tenantId,
      borrowerId,
      loanId,
      ruleId,
      status: "DRAFT",
      startDate,
      endDate,
      loanAmount,
      interestRate,
      termMonths,
      paymentFrequency: paymentFrequency as ContractAsset["paymentFrequency"],
      installmentAmount,
      totalInstallments,
      totalAmountDue,
      totalAmountPaid: "0",
      outstandingBalance: loanAmount,
      signatures: [],
      termsAndConditions,
      disbursementInfo: null,
      signedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(contract)));
    ctx.stub.setEvent(
      "ContractCreated",
      Buffer.from(JSON.stringify({ id, contractNumber, loanId })),
    );
    return contract;
  }

  @Transaction(false)
  @Returns("string")
  async getContract(ctx: Context, id: string): Promise<string> {
    const contractBytes = await ctx.stub.getState(id);
    if (!contractBytes || contractBytes.length === 0) {
      throw new Error(`Contract ${id} does not exist`);
    }
    return contractBytes.toString();
  }

  @Transaction()
  async signContract(
    ctx: Context,
    id: string,
    signerId: string,
    signerRole: string,
    signatureHash: string,
  ): Promise<ContractAsset> {
    const contract = await this.fetchContract(ctx, id);

    if (!["DRAFT", "PENDING_SIGNATURES"].includes(contract.status)) {
      throw new Error(`Contract ${id} is not open for signing`);
    }

    const alreadySigned = contract.signatures.some(
      (s) => s.signerId === signerId,
    );
    if (alreadySigned) {
      throw new Error(`Signer ${signerId} has already signed contract ${id}`);
    }

    const signature: ContractSignature = {
      signerId,
      signerRole,
      signedAt: new Date().toISOString(),
      signatureHash,
    };

    contract.signatures.push(signature);
    contract.updatedAt = new Date().toISOString();

    if (contract.status === "DRAFT") {
      contract.status = "PENDING_SIGNATURES";
    }

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(contract)));
    ctx.stub.setEvent(
      "ContractSigned",
      Buffer.from(JSON.stringify({ id, signerId, signerRole })),
    );
    return contract;
  }

  @Transaction()
  async activateContract(ctx: Context, id: string): Promise<ContractAsset> {
    const contract = await this.fetchContract(ctx, id);

    if (contract.status !== "PENDING_SIGNATURES") {
      throw new Error(
        `Contract ${id} must be in PENDING_SIGNATURES status to activate`,
      );
    }

    contract.status = "ACTIVE";
    contract.signedAt = new Date().toISOString();
    contract.updatedAt = new Date().toISOString();

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(contract)));
    ctx.stub.setEvent("ContractActivated", Buffer.from(JSON.stringify({ id })));
    return contract;
  }

  @Transaction()
  async recordDisbursement(
    ctx: Context,
    id: string,
    disbursedAmount: string,
    method: string,
    reference: string,
  ): Promise<ContractAsset> {
    const contract = await this.fetchContract(ctx, id);

    if (contract.status !== "ACTIVE") {
      throw new Error(`Contract ${id} must be ACTIVE for disbursement`);
    }

    if (contract.disbursementInfo) {
      throw new Error(`Contract ${id} already has a disbursement recorded`);
    }

    contract.disbursementInfo = {
      disbursedAt: new Date().toISOString(),
      disbursedAmount,
      method,
      reference,
    };
    contract.updatedAt = new Date().toISOString();

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(contract)));
    ctx.stub.setEvent(
      "ContractDisbursed",
      Buffer.from(JSON.stringify({ id, disbursedAmount })),
    );
    return contract;
  }

  @Transaction()
  async updatePaymentBalance(
    ctx: Context,
    id: string,
    paymentAmount: string,
  ): Promise<ContractAsset> {
    const contract = await this.fetchContract(ctx, id);

    if (contract.status !== "ACTIVE") {
      throw new Error(`Contract ${id} must be ACTIVE to record payment`);
    }

    const paid =
      parseFloat(contract.totalAmountPaid) + parseFloat(paymentAmount);
    const outstanding = parseFloat(contract.totalAmountDue) - paid;

    contract.totalAmountPaid = paid.toFixed(2);
    contract.outstandingBalance = Math.max(0, outstanding).toFixed(2);
    contract.updatedAt = new Date().toISOString();

    if (outstanding <= 0) {
      contract.status = "COMPLETED";
    }

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(contract)));
    ctx.stub.setEvent(
      "ContractPaymentRecorded",
      Buffer.from(
        JSON.stringify({
          id,
          paymentAmount,
          outstandingBalance: contract.outstandingBalance,
        }),
      ),
    );
    return contract;
  }

  @Transaction()
  async updateContractStatus(
    ctx: Context,
    id: string,
    newStatus: ContractStatus,
  ): Promise<ContractAsset> {
    const contract = await this.fetchContract(ctx, id);

    const validTransition = CONTRACT_STATUS_TRANSITIONS.find(
      (t) => t.to === newStatus && t.from.includes(contract.status),
    );

    if (!validTransition) {
      throw new Error(
        `Invalid status transition from ${contract.status} to ${newStatus}`,
      );
    }

    contract.status = newStatus;
    contract.updatedAt = new Date().toISOString();

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(contract)));
    ctx.stub.setEvent(
      "ContractStatusUpdated",
      Buffer.from(JSON.stringify({ id, status: newStatus })),
    );
    return contract;
  }

  @Transaction(false)
  @Returns("string")
  async queryContractsByTenant(
    ctx: Context,
    tenantId: string,
  ): Promise<string> {
    const query = {
      selector: {
        docType: "contract",
        tenantId,
      },
    };
    return this.runQuery(ctx, JSON.stringify(query));
  }

  @Transaction(false)
  @Returns("string")
  async queryContractsByBorrower(
    ctx: Context,
    borrowerId: string,
  ): Promise<string> {
    const query = {
      selector: {
        docType: "contract",
        borrowerId,
      },
    };
    return this.runQuery(ctx, JSON.stringify(query));
  }

  @Transaction(false)
  @Returns("string")
  async getContractHistory(ctx: Context, id: string): Promise<string> {
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
  async contractExists(ctx: Context, id: string): Promise<boolean> {
    const contractBytes = await ctx.stub.getState(id);
    return !!contractBytes && contractBytes.length > 0;
  }

  private async fetchContract(
    ctx: Context,
    id: string,
  ): Promise<ContractAsset> {
    const contractBytes = await ctx.stub.getState(id);
    if (!contractBytes || contractBytes.length === 0) {
      throw new Error(`Contract ${id} does not exist`);
    }
    return JSON.parse(contractBytes.toString()) as ContractAsset;
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
