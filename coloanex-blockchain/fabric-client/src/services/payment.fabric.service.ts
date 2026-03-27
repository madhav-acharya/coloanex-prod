import { FabricGatewayClient } from "../gateway.client";
import { FabricConnectionProfile } from "../types";

export class PaymentFabricService {
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

  async recordPayment(
    id: string,
    contractId: string,
    borrowerId: string,
    tenantId: string,
    amount: string,
    paymentMethod: string,
    reference: string,
    installmentNumbers: number[],
    penaltyAmount: string,
  ) {
    return this.client.submitTransaction(
      "recordPayment",
      id,
      contractId,
      borrowerId,
      tenantId,
      amount,
      paymentMethod,
      reference,
      JSON.stringify(installmentNumbers),
      penaltyAmount,
    );
  }

  async getPayment(id: string) {
    return this.client.evaluateTransaction("getPayment", id);
  }

  async updatePaymentStatus(
    id: string,
    newStatus: string,
    gatewayTransactionId?: string,
  ) {
    const args = gatewayTransactionId
      ? [id, newStatus, gatewayTransactionId]
      : [id, newStatus];
    return this.client.submitTransaction("updatePaymentStatus", ...args);
  }

  async getPaymentsByContract(contractId: string) {
    return this.client.evaluateTransaction(
      "queryPaymentsByContract",
      contractId,
    );
  }

  async getPaymentsByBorrower(borrowerId: string) {
    return this.client.evaluateTransaction(
      "queryPaymentsByBorrower",
      borrowerId,
    );
  }

  async getPaymentsByTenant(tenantId: string) {
    return this.client.evaluateTransaction("queryPaymentsByTenant", tenantId);
  }

  async getPaymentHistory(id: string) {
    return this.client.evaluateTransaction("getPaymentHistory", id);
  }

  async paymentExists(id: string): Promise<boolean> {
    const result = await this.client.evaluateTransaction("paymentExists", id);
    return result === true || result === "true";
  }

  async verifyTransactionHash(id: string, txHash: string) {
    return this.client.evaluateTransaction("verifyTransactionHash", id, txHash);
  }
}
