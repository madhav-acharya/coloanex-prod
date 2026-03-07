import { Context } from "fabric-contract-api";
import { LoanChaincode } from "./loan.chaincode";
import { LoanAsset } from "./types";

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

function makeLoan(overrides: Partial<LoanAsset> = {}): LoanAsset {
  return {
    docType: "loan",
    id: "loan-1",
    borrowerId: "borrower-1",
    tenantId: "tenant-1",
    requestedAmount: "10000",
    approvedAmount: null,
    purpose: "Business expansion",
    collateralDetails: { type: "property", value: "50000" },
    requestedTermMonths: 12,
    approvedTermMonths: null,
    status: "DRAFT",
    rejectionReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("LoanChaincode", () => {
  let chaincode: LoanChaincode;
  let stub: MockStub;
  let ctx: Context;

  beforeEach(() => {
    chaincode = new LoanChaincode();
    stub = {
      getState: jest.fn(),
      putState: jest.fn().mockResolvedValue(undefined),
      setEvent: jest.fn(),
      getQueryResult: jest.fn(),
      getHistoryForKey: jest.fn(),
    };
    ctx = makeCtx(stub);
  });

  describe("createLoan", () => {
    it("creates a new loan with DRAFT status", async () => {
      stub.getState.mockResolvedValue(Buffer.from(""));

      const result = await chaincode.createLoan(
        ctx,
        "loan-1",
        "borrower-1",
        "tenant-1",
        "10000",
        "Business expansion",
        JSON.stringify({ type: "property", value: "50000" }),
        12,
      );

      expect(result.id).toBe("loan-1");
      expect(result.status).toBe("DRAFT");
      expect(result.docType).toBe("loan");
      expect(stub.putState).toHaveBeenCalledTimes(1);
      expect(stub.setEvent).toHaveBeenCalledWith(
        "LoanCreated",
        expect.any(Buffer),
      );
    });

    it("throws if loan already exists", async () => {
      stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(makeLoan())));

      await expect(
        chaincode.createLoan(
          ctx,
          "loan-1",
          "borrower-1",
          "tenant-1",
          "10000",
          "purpose",
          "{}",
          12,
        ),
      ).rejects.toThrow("Loan loan-1 already exists");
    });
  });

  describe("getLoan", () => {
    it("returns serialized loan", async () => {
      const loan = makeLoan();
      stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(loan)));

      const result = await chaincode.getLoan(ctx, "loan-1");
      expect(JSON.parse(result).id).toBe("loan-1");
    });

    it("throws if loan does not exist", async () => {
      stub.getState.mockResolvedValue(Buffer.from(""));
      await expect(chaincode.getLoan(ctx, "loan-99")).rejects.toThrow(
        "Loan loan-99 does not exist",
      );
    });
  });

  describe("updateLoanStatus", () => {
    it("transitions DRAFT → PENDING", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeLoan({ status: "DRAFT" }))),
      );

      const result = await chaincode.updateLoanStatus(ctx, "loan-1", "PENDING");
      expect(result.status).toBe("PENDING");
    });

    it("transitions UNDER_REVIEW → REJECTED and sets rejectionReason", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeLoan({ status: "UNDER_REVIEW" }))),
      );

      const result = await chaincode.updateLoanStatus(
        ctx,
        "loan-1",
        "REJECTED",
        "Insufficient collateral",
      );
      expect(result.status).toBe("REJECTED");
      expect(result.rejectionReason).toBe("Insufficient collateral");
    });

    it("throws on invalid status transition", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeLoan({ status: "DRAFT" }))),
      );

      await expect(
        chaincode.updateLoanStatus(ctx, "loan-1", "APPROVED"),
      ).rejects.toThrow("Invalid status transition from DRAFT to APPROVED");
    });
  });

  describe("approveLoan", () => {
    it("approves a loan under review", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeLoan({ status: "UNDER_REVIEW" }))),
      );

      const result = await chaincode.approveLoan(ctx, "loan-1", "9500", 12);
      expect(result.status).toBe("APPROVED");
      expect(result.approvedAmount).toBe("9500");
      expect(result.approvedTermMonths).toBe(12);
    });

    it("throws if loan is not UNDER_REVIEW", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeLoan({ status: "DRAFT" }))),
      );
      await expect(
        chaincode.approveLoan(ctx, "loan-1", "9500", 12),
      ).rejects.toThrow("must be UNDER_REVIEW");
    });
  });

  describe("loanExists", () => {
    it("returns true when loan exists", async () => {
      stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(makeLoan())));
      expect(await chaincode.loanExists(ctx, "loan-1")).toBe(true);
    });

    it("returns false when loan does not exist", async () => {
      stub.getState.mockResolvedValue(Buffer.from(""));
      expect(await chaincode.loanExists(ctx, "loan-1")).toBe(false);
    });
  });

  describe("queryLoansByTenant", () => {
    it("returns serialized list of loans", async () => {
      const loan = makeLoan();
      stub.getQueryResult.mockResolvedValue(
        makeIterator([{ value: Buffer.from(JSON.stringify(loan)) }]),
      );

      const result = await chaincode.queryLoansByTenant(ctx, "tenant-1");
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("loan-1");
    });

    it("returns empty array when no loans found", async () => {
      stub.getQueryResult.mockResolvedValue(makeIterator([]));
      const result = await chaincode.queryLoansByTenant(ctx, "tenant-99");
      expect(JSON.parse(result)).toHaveLength(0);
    });
  });

  describe("getLoanHistory", () => {
    it("returns history records", async () => {
      stub.getHistoryForKey.mockResolvedValue(
        makeIterator([
          {
            txId: "tx-1",
            timestamp: { seconds: 1000, nanos: 0 },
            isDelete: false,
            value: Buffer.from(JSON.stringify(makeLoan())),
          },
        ]),
      );

      const result = await chaincode.getLoanHistory(ctx, "loan-1");
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].txId).toBe("tx-1");
    });
  });
});
