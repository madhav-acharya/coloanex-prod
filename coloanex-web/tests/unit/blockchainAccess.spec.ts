import {
  getBlockchainAccessSnapshot,
  formatGasPaymentMode,
} from "../../src/utils/blockchainAccess";

describe("blockchainAccess", () => {
  it("returns blocked snapshot when platform wallet has no active subscription", () => {
    const snapshot = getBlockchainAccessSnapshot({
      gasPaymentMode: "PLATFORM_WALLET",
      wallets: [],
      subscriptions: [],
    });

    expect(snapshot.mode).toBe("PLATFORM_WALLET");
    expect(snapshot.canRunBlockchain).toBe(false);
    expect(snapshot.reason).toContain("active subscription");
  });

  it("formats gas payment mode", () => {
    expect(formatGasPaymentMode("USER_WALLET")).toBe("User Wallet");
    expect(formatGasPaymentMode("UNKNOWN")).toBe("Not Configured");
  });
});
