import { Context } from "fabric-contract-api";
import { ContractChaincode } from "./contract.chaincode";
import { ContractAsset } from "./types";

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

function makeContract(overrides: Partial<ContractAsset> = {}): ContractAsset {
  return {
    docType: "contract",
    id: "contract-1",
    contractNumber: "CN-001",
    tenantId: "tenant-1",
    borrowerId: "borrower-1",
    loanId: "loan-1",
    ruleId: "rule-1",
    status: "DRAFT",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2027-01-01T00:00:00.000Z",
    loanAmount: "10000",
    interestRate: "12.00",
    termMonths: 12,
    paymentFrequency: "MONTHLY",
    installmentAmount: "888.49",
    totalInstallments: 12,
    totalAmountDue: "10661.88",
    totalAmountPaid: "0",
    outstandingBalance: "10000",
    signatures: [],
    termsAndConditions: "Standard terms apply.",
    disbursementInfo: null,
    signedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ContractChaincode", () => {
  let chaincode: ContractChaincode;
  let stub: MockStub;
  let ctx: Context;

  beforeEach(() => {
    chaincode = new ContractChaincode();
    stub = {
      getState: jest.fn(),
      putState: jest.fn().mockResolvedValue(undefined),
      setEvent: jest.fn(),
      getQueryResult: jest.fn(),
      getHistoryForKey: jest.fn(),
    };
    ctx = makeCtx(stub);
  });

  describe("createContract", () => {
    it("creates a contract with DRAFT status", async () => {
      stub.getState.mockResolvedValue(Buffer.from(""));

      const result = await chaincode.createContract(
        ctx,
        "contract-1",
        "CN-001",
        "tenant-1",
        "borrower-1",
        "loan-1",
        "rule-1",
        "2026-01-01T00:00:00.000Z",
        "2027-01-01T00:00:00.000Z",
        "10000",
        "12.00",
        12,
        "MONTHLY",
        "888.49",
        12,
        "10661.88",
        "Standard terms apply.",
      );

      expect(result.status).toBe("DRAFT");
      expect(result.contractNumber).toBe("CN-001");
      expect(result.signatures).toHaveLength(0);
      expect(stub.putState).toHaveBeenCalledTimes(1);
    });

    it("throws if contract already exists", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeContract())),
      );

      await expect(
        chaincode.createContract(
          ctx,
          "contract-1",
          "CN-001",
          "tenant-1",
          "borrower-1",
          "loan-1",
          "rule-1",
          "2026-01-01T00:00:00.000Z",
          "2027-01-01T00:00:00.000Z",
          "10000",
          "12.00",
          12,
          "MONTHLY",
          "888.49",
          12,
          "10661.88",
          "terms",
        ),
      ).rejects.toThrow("Contract contract-1 already exists");
    });
  });

  describe("signContract", () => {
    it("adds signature and moves to PENDING_SIGNATURES", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeContract({ status: "DRAFT" }))),
      );

      const result = await chaincode.signContract(
        ctx,
        "contract-1",
        "borrower-1",
        "BORROWER",
        "hash-abc",
      );

      expect(result.status).toBe("PENDING_SIGNATURES");
      expect(result.signatures).toHaveLength(1);
      expect(result.signatures[0].signerId).toBe("borrower-1");
    });

    it("throws if same signer signs twice", async () => {
      const contract = makeContract({
        status: "PENDING_SIGNATURES",
        signatures: [
          {
            signerId: "borrower-1",
            signerRole: "BORROWER",
            signedAt: "2026-01-01T00:00:00.000Z",
            signatureHash: "hash-abc",
          },
        ],
      });
      stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(contract)));

      await expect(
        chaincode.signContract(
          ctx,
          "contract-1",
          "borrower-1",
          "BORROWER",
          "hash-xyz",
        ),
      ).rejects.toThrow("already signed");
    });

    it("throws if contract is not open for signing", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeContract({ status: "ACTIVE" }))),
      );

      await expect(
        chaincode.signContract(ctx, "contract-1", "lender-1", "LENDER", "hash"),
      ).rejects.toThrow("not open for signing");
    });
  });

  describe("activateContract", () => {
    it("activates a contract in PENDING_SIGNATURES status", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(
          JSON.stringify(makeContract({ status: "PENDING_SIGNATURES" })),
        ),
      );

      const result = await chaincode.activateContract(ctx, "contract-1");
      expect(result.status).toBe("ACTIVE");
      expect(result.signedAt).not.toBeNull();
    });

    it("throws if contract is not PENDING_SIGNATURES", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeContract({ status: "DRAFT" }))),
      );
      await expect(
        chaincode.activateContract(ctx, "contract-1"),
      ).rejects.toThrow("PENDING_SIGNATURES");
    });
  });

  describe("recordDisbursement", () => {
    it("records disbursement info on ACTIVE contract", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeContract({ status: "ACTIVE" }))),
      );

      const result = await chaincode.recordDisbursement(
        ctx,
        "contract-1",
        "10000",
        "BANK_TRANSFER",
        "REF-001",
      );

      expect(result.disbursementInfo).not.toBeNull();
      expect(result.disbursementInfo!.disbursedAmount).toBe("10000");
    });

    it("throws if contract is not ACTIVE", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeContract({ status: "DRAFT" }))),
      );
      await expect(
        chaincode.recordDisbursement(
          ctx,
          "contract-1",
          "10000",
          "BANK_TRANSFER",
          "REF",
        ),
      ).rejects.toThrow("must be ACTIVE");
    });
  });

  describe("updatePaymentBalance", () => {
    it("updates totalAmountPaid and outstandingBalance", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(
          JSON.stringify(
            makeContract({
              status: "ACTIVE",
              totalAmountPaid: "0",
              totalAmountDue: "10661.88",
              outstandingBalance: "10661.88",
            }),
          ),
        ),
      );

      const result = await chaincode.updatePaymentBalance(
        ctx,
        "contract-1",
        "888.49",
      );
      expect(parseFloat(result.totalAmountPaid)).toBeCloseTo(888.49, 1);
      expect(result.status).toBe("ACTIVE");
    });

    it("marks contract COMPLETED when fully paid", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(
          JSON.stringify(
            makeContract({
              status: "ACTIVE",
              totalAmountPaid: "9773.39",
              totalAmountDue: "10661.88",
              outstandingBalance: "888.49",
            }),
          ),
        ),
      );

      const result = await chaincode.updatePaymentBalance(
        ctx,
        "contract-1",
        "888.49",
      );
      expect(result.status).toBe("COMPLETED");
      expect(result.outstandingBalance).toBe("0.00");
    });
  });

  describe("contractExists", () => {
    it("returns true when contract exists", async () => {
      stub.getState.mockResolvedValue(
        Buffer.from(JSON.stringify(makeContract())),
      );
      expect(await chaincode.contractExists(ctx, "contract-1")).toBe(true);
    });

    it("returns false when contract does not exist", async () => {
      stub.getState.mockResolvedValue(Buffer.from(""));
      expect(await chaincode.contractExists(ctx, "contract-99")).toBe(false);
    });
  });

  describe("queryContractsByTenant", () => {
    it("returns list of contracts for a tenant", async () => {
      const contract = makeContract();
      stub.getQueryResult.mockResolvedValue(
        makeIterator([{ value: Buffer.from(JSON.stringify(contract)) }]),
      );

      const result = await chaincode.queryContractsByTenant(ctx, "tenant-1");
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].contractNumber).toBe("CN-001");
    });
  });
});
