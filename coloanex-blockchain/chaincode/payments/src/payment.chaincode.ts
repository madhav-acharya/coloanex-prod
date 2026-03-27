import {
  Context,
  Contract,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import {
  PaymentAsset,
  PaymentStatus,
  PAYMENT_STATUS_TRANSITIONS,
} from "./types";

@Info({
  title: "PaymentChaincode",
  description:
    "Payment tracking and immutable audit trail on Hyperledger Fabric",
})
export class PaymentChaincode extends Contract {
  constructor() {
    super("PaymentChaincode");
  }

  @Transaction()
  async initLedger(ctx: Context): Promise<void> {
    console.log("PaymentChaincode ledger initialized");
  }

  @Transaction()
  async recordPayment(
    ctx: Context,
    id: string,
    contractId: string,
    borrowerId: string,
    tenantId: string,
    amount: string,
    paymentMethod: string,
    reference: string,
    installmentNumbersJson: string,
    penaltyAmount: string,
  ): Promise<PaymentAsset> {
    const exists = await this.paymentExists(ctx, id);
    if (exists) {
      throw new Error(`Payment ${id} already exists`);
    }

    const payment: PaymentAsset = {
      docType: "payment",
      id,
      contractId,
      borrowerId,
      tenantId,
      amount,
      paymentMethod: paymentMethod as PaymentAsset["paymentMethod"],
      status: "PENDING",
      paymentDate: this.txTime(ctx),
      reference,
      gatewayTransactionId: null,
      installmentNumbers: JSON.parse(installmentNumbersJson),
      penaltyAmount,
      createdAt: this.txTime(ctx),
      updatedAt: this.txTime(ctx),
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(payment)));
    ctx.stub.setEvent(
      "PaymentRecorded",
      Buffer.from(JSON.stringify({ id, contractId, amount })),
    );
    return payment;
  }

  @Transaction(false)
  @Returns("string")
  async getPayment(ctx: Context, id: string): Promise<string> {
    const paymentBytes = await ctx.stub.getState(id);
    if (!paymentBytes || paymentBytes.length === 0) {
      throw new Error(`Payment ${id} does not exist`);
    }
    return paymentBytes.toString();
  }

  @Transaction()
  async updatePaymentStatus(
    ctx: Context,
    id: string,
    newStatus: PaymentStatus,
    gatewayTransactionId?: string,
  ): Promise<PaymentAsset> {
    const payment = await this.fetchPayment(ctx, id);

    const validTransition = PAYMENT_STATUS_TRANSITIONS.find(
      (t) => t.to === newStatus && t.from.includes(payment.status),
    );

    if (!validTransition) {
      throw new Error(
        `Invalid status transition from ${payment.status} to ${newStatus}`,
      );
    }

    payment.status = newStatus;
    payment.updatedAt = this.txTime(ctx);

    if (gatewayTransactionId) {
      payment.gatewayTransactionId = gatewayTransactionId;
    }

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(payment)));
    ctx.stub.setEvent(
      "PaymentStatusUpdated",
      Buffer.from(
        JSON.stringify({
          id,
          status: newStatus,
          contractId: payment.contractId,
        }),
      ),
    );
    return payment;
  }

  @Transaction(false)
  @Returns("string")
  async queryPaymentsByContract(
    ctx: Context,
    contractId: string,
  ): Promise<string> {
    const query = {
      selector: {
        docType: "payment",
        contractId,
      },
    };
    return this.runQuery(ctx, JSON.stringify(query));
  }

  @Transaction(false)
  @Returns("string")
  async queryPaymentsByBorrower(
    ctx: Context,
    borrowerId: string,
  ): Promise<string> {
    const query = {
      selector: {
        docType: "payment",
        borrowerId,
      },
    };
    return this.runQuery(ctx, JSON.stringify(query));
  }

  @Transaction(false)
  @Returns("string")
  async queryPaymentsByTenant(ctx: Context, tenantId: string): Promise<string> {
    const query = {
      selector: {
        docType: "payment",
        tenantId,
      },
    };
    return this.runQuery(ctx, JSON.stringify(query));
  }

  @Transaction(false)
  @Returns("string")
  async getPaymentHistory(ctx: Context, id: string): Promise<string> {
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
  async paymentExists(ctx: Context, id: string): Promise<boolean> {
    const paymentBytes = await ctx.stub.getState(id);
    return !!paymentBytes && paymentBytes.length > 0;
  }

  @Transaction(false)
  @Returns("string")
  async verifyTransactionHash(
    ctx: Context,
    id: string,
    txHash: string,
  ): Promise<string> {
    const results: any[] = [];
    const iterator = await ctx.stub.getHistoryForKey(id);

    while (true) {
      const { done, value } = await iterator.next();
      if (done || !value) break;

      if (value.txId === txHash) {
        results.push({
          txId: value.txId,
          timestamp: value.timestamp,
          isDelete: value.isDelete,
          value: value.value.toString(),
          verified: true,
        });
      }
    }

    await iterator.close();
    return JSON.stringify({
      verified: results.length > 0,
      transaction: results.length > 0 ? results[0] : null,
    });
  }

  private txTime(ctx: Context): string {
    const ts = ctx.stub.getTxTimestamp();
    return new Date(Number(ts.seconds) * 1000).toISOString();
  }

  private async fetchPayment(ctx: Context, id: string): Promise<PaymentAsset> {
    const paymentBytes = await ctx.stub.getState(id);
    if (!paymentBytes || paymentBytes.length === 0) {
      throw new Error(`Payment ${id} does not exist`);
    }
    return JSON.parse(paymentBytes.toString()) as PaymentAsset;
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
