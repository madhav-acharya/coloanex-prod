import { FabricGatewayClient } from "../gateway.client";
import { FabricConnectionProfile } from "../types";

export class LoanFabricService {
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

  async createLoan(
    id: string,
    borrowerId: string,
    tenantId: string,
    requestedAmount: string,
    purpose: string,
    collateralDetails: Record<string, unknown>,
    requestedTermMonths: number,
  ) {
    return this.client.submitTransaction(
      "createLoan",
      id,
      borrowerId,
      tenantId,
      requestedAmount,
      purpose,
      JSON.stringify(collateralDetails),
      String(requestedTermMonths),
    );
  }

  async getLoan(id: string) {
    return this.client.evaluateTransaction("getLoan", id);
  }

  async updateLoanStatus(id: string, newStatus: string, reason?: string) {
    return this.client.submitTransaction(
      "updateLoanStatus",
      id,
      newStatus,
      reason ?? "",
    );
  }

  async approveLoan(
    id: string,
    approvedAmount: string,
    approvedTermMonths: number,
  ) {
    return this.client.submitTransaction(
      "approveLoan",
      id,
      approvedAmount,
      String(approvedTermMonths),
    );
  }

  async getLoansByTenant(tenantId: string) {
    return this.client.evaluateTransaction("queryLoansByTenant", tenantId);
  }

  async getLoansByBorrower(borrowerId: string) {
    return this.client.evaluateTransaction("queryLoansByBorrower", borrowerId);
  }

  async getLoanHistory(id: string) {
    return this.client.evaluateTransaction("getLoanHistory", id);
  }

  async loanExists(id: string): Promise<boolean> {
    const result = await this.client.evaluateTransaction("loanExists", id);
    return result === true || result === "true";
  }

}
