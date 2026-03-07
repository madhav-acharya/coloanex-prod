import { Context } from "fabric-contract-api";
import { PaymentChaincode } from "./payment.chaincode";
import { PaymentAsset } from "./types";

type MockStub = {
  getState: jest.Mock;
  putState: jest.Mock;
  setEvent: jest.Mock;
  getQueryResult: jest.Mock;
  getHistoryForKey: jest.Mock;
};

function makeCtx(stub: MockStub): Context {
  return { stub } as unknown as Context;
}

function makeIterator<T>(items: T[]) {
  let index = 0;
  return {
    next: jest.fn(async () => {
      if (index < items.length) {
        return { done: false as const, value: items[index++] };
      }
      return { done: true as const, value: undefined };
    }),
    close: jest.fn(async () => {}),
  };
}

function makePayment(overrides: Partial<PaymentAsset> = {}): PaymentAsset {
  return {
    docType: "payment",
    id: "payment-1",
    contractId: "contract-1",
    borrowerId: "borrower-1",
    tenantId: "tenant-1",
    amount: "888.49",
    paymentMethod: "ESEWA",
    status: "PENDING",
    paymentDate: "2026-01-01T00:00:00.000Z",
    reference: "REF-001",
    gatewayTransactionId: null,
    installmentNumbers: [1],
    penaltyAmount: "0",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("PaymentChaincode", () => {
  let chaincode: PaymentChaincode;
  let stub: MockStub;
  let ctx: Context;

  beforeEach(() => {
    chaincode = new PaymentChaincode();
    stub = {
      getState: jest.fn(),
      putState: jest.fn().mockResolvedValue(undefined),
      setEvent: jest.fn(),
      getQueryResult: jest.fn(),
      getHistoryForKey: jest.fn(),
    };
    ctx = makeCtx(stub);
  });

  describe("recordPayment", () => {
    it("creates a payment record with PENDING status", async () => {
      stub.getState.mockResolvedValue(Buffer.from(""));

      const result = await chaincode.recordPayment(
        ctx,
        "payment-1",
        "contract-1",
        "borrower-1",
        "tenant-1",
        "888.49",
        "ESEWA",
        "REF-001",
        JSON.stringify([1]),
        "0",
      );

      expect(result.id).toBe("payment-1");
      expect(result.status).toBe("PENDING");
      expect(result.installmentNumbers).toEqual([1]);
      expect(stub.putState).toHaveBeenCalledTimes(1);
    });

    it("throws if payment already exists", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makePayment())),
      );

      await expect(
        chaincode.recordPayment(
          ctx,
          "payment-1",
          "contract-1",
          "borrower-1",
          "tenant-1",
          "888.49",
          "ESEWA",
          "REF-001",
          "[1]",
          "0",
        ),
      ).rejects.toThrow("Payment payment-1 already exists");
    });
  });

  describe("getPayment", () => {
    it("returns serialized payment", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makePayment())),
      );

      const result = await chaincode.getPayment(ctx, "payment-1");
      expect(JSON.parse(result).id).toBe("payment-1");
    });

    it("throws if payment does not exist", async () => {
      stub.getState.mockResolvedValue(Buffer.from(""));
      await expect(chaincode.getPayment(ctx, "payment-99")).rejects.toThrow(
        "Payment payment-99 does not exist",
      );
    });
  });

  describe("updatePaymentStatus", () => {
    it("transitions PENDING → COMPLETED and stores gateway txId", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makePayment({ status: "PENDING" }))),
      );

      const result = await chaincode.updatePaymentStatus(
        ctx,
        "payment-1",
        "COMPLETED",
        "gw-tx-123",
      );

      expect(result.status).toBe("COMPLETED");
      expect(result.gatewayTransactionId).toBe("gw-tx-123");
    });

    it("transitions PENDING → FAILED", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makePayment({ status: "PENDING" }))),
      );

      const result = await chaincode.updatePaymentStatus(
        ctx,
        "payment-1",
        "FAILED",
      );
      expect(result.status).toBe("FAILED");
    });

    it("transitions COMPLETED → REFUNDED", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makePayment({ status: "COMPLETED" }))),
      );

      const result = await chaincode.updatePaymentStatus(
        ctx,
        "payment-1",
        "REFUNDED",
      );
      expect(result.status).toBe("REFUNDED");
    });

    it("throws on invalid status transition", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makePayment({ status: "FAILED" }))),
      );

      await expect(
        chaincode.updatePaymentStatus(ctx, "payment-1", "COMPLETED"),
      ).rejects.toThrow("Invalid status transition from FAILED to COMPLETED");
    });
  });

  describe("paymentExists", () => {
    it("returns true when payment exists", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makePayment())),
      );
      expect(await chaincode.paymentExists(ctx, "payment-1")).toBe(true);
    });

    it("returns false when payment does not exist", async () => {
      stub.getState.mockResolvedValue(Buffer.from(""));
      expect(await chaincode.paymentExists(ctx, "payment-99")).toBe(false);
    });
  });

  describe("queryPaymentsByContract", () => {
    it("returns list of payments for a contract", async () => {
      const payment = makePayment();
      stub.getQueryResult.mockResolvedValue(
        makeIterator([{ value: Buffer.from(JSON.stringify(payment)) }]),
      );

      const result = await chaincode.queryPaymentsByContract(ctx, "contract-1");
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].contractId).toBe("contract-1");
    });

    it("returns empty array when no payments found", async () => {
      stub.getQueryResult.mockResolvedValue(makeIterator([]));
      const result = await chaincode.queryPaymentsByContract(
        ctx,
        "contract-99",
      );
      expect(JSON.parse(result)).toHaveLength(0);
    });
  });

  describe("getPaymentHistory", () => {
    it("returns history records", async () => {
      stub.getHistoryForKey.mockResolvedValue(
        makeIterator([
          {
            txId: "tx-1",
            timestamp: { seconds: 1000, nanos: 0 },
            isDelete: false,
            value: Buffer.from(JSON.stringify(makePayment())),
          },
        ]),
      );

      const result = await chaincode.getPaymentHistory(ctx, "payment-1");
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].txId).toBe("tx-1");
    });
  });
});
