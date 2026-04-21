const alert = jest.fn();
const openURL = jest.fn().mockResolvedValue(undefined);

jest.mock("react-native", () => ({
  Alert: { alert: (...args: any[]) => alert(...args) },
  Linking: { openURL: (...args: any[]) => openURL(...args) },
}));

import {
  getBlockchainConfig,
  showBlockchainInfo,
} from "../../utils/blockchain";

describe("blockchain", () => {
  beforeEach(() => {
    alert.mockClear();
    openURL.mockClear();
  });

  it("returns config from env", () => {
    process.env.EXPO_PUBLIC_BLOCKCHAIN_LOAN_REGISTRY = "loan";
    process.env.EXPO_PUBLIC_BLOCKCHAIN_CONTRACT_REGISTRY = "contract";
    process.env.EXPO_PUBLIC_BLOCKCHAIN_PAYMENT_REGISTRY = "payment";
    process.env.EXPO_PUBLIC_BLOCKCHAIN_KYC_REGISTRY = "kyc";
    process.env.EXPO_PUBLIC_BLOCKCHAIN_RULE_REGISTRY = "rule";

    const config = getBlockchainConfig();
    expect(config.contracts.loanRegistry).toBe("loan");
    expect(config.contracts.contractRegistry).toBe("contract");
    expect(config.contracts.paymentRegistry).toBe("payment");
    expect(config.contracts.kycRegistry).toBe("kyc");
    expect(config.contracts.ruleRegistry).toBe("rule");
  });

  it("shows info when tx hash missing", () => {
    showBlockchainInfo();
    expect(alert).toHaveBeenCalled();
  });

  it("opens explorer when tx hash present", () => {
    showBlockchainInfo("0xabc");
    expect(openURL).toHaveBeenCalledWith(
      "https://sepolia.etherscan.io/tx/0xabc",
    );
  });
});
