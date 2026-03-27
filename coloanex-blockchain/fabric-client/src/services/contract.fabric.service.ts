import { FabricGatewayClient } from "../gateway.client";
import { FabricConnectionProfile } from "../types";

export class ContractFabricService {
  private readonly client: FabricGatewayClient;

  constructor(profile: FabricConnectionProfile) {
    this.client = new FabricGatewayClient(profile);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  async createContract(
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
  ) {
    return this.client.submitTransaction(
      "createContract",
      id,
      contractNumber,
      tenantId,
      borrowerId,
      loanId,
      ruleId,
      startDate,
      endDate,
      loanAmount,
      interestRate,
      String(termMonths),
      paymentFrequency,
      installmentAmount,
      String(totalInstallments),
      totalAmountDue,
      termsAndConditions,
    );
  }

  async getContract(id: string) {
    return this.client.evaluateTransaction("getContract", id);
  }

  async signContract(
    id: string,
    signerId: string,
    signerRole: string,
    signatureHash: string,
  ) {
    return this.client.submitTransaction(
      "signContract",
      id,
      signerId,
      signerRole,
      signatureHash,
    );
  }

  async activateContract(id: string) {
    return this.client.submitTransaction("activateContract", id);
  }

  async recordDisbursement(
    id: string,
    disbursedAmount: string,
    method: string,
    reference: string,
  ) {
    return this.client.submitTransaction(
      "recordDisbursement",
      id,
      disbursedAmount,
      method,
      reference,
    );
  }

  async updatePaymentBalance(id: string, paymentAmount: string) {
    return this.client.submitTransaction(
      "updatePaymentBalance",
      id,
      paymentAmount,
    );
  }

  async updateContractStatus(id: string, newStatus: string) {
    return this.client.submitTransaction("updateContractStatus", id, newStatus);
  }

  async getContractsByTenant(tenantId: string) {
    return this.client.evaluateTransaction("queryContractsByTenant", tenantId);
  }

  async getContractsByBorrower(borrowerId: string) {
    return this.client.evaluateTransaction(
      "queryContractsByBorrower",
      borrowerId,
    );
  }

  async getContractHistory(id: string) {
    return this.client.evaluateTransaction("getContractHistory", id);
  }

  async contractExists(id: string): Promise<boolean> {
    const result = await this.client.evaluateTransaction("contractExists", id);
    return result === true || result === "true";
  }

  async verifyTransactionHash(id: string, txHash: string) {
    return this.client.evaluateTransaction("verifyTransactionHash", id, txHash);
  }
}
