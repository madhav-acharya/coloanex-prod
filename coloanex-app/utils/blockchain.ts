import { Linking, Alert } from "react-native";
import { getBlockchainEnabled } from "../api/configApi";

let blockchainEnabled: boolean | null = null;

const getBlockchainStatus = async (): Promise<boolean> => {
  if (blockchainEnabled === null) {
    try {
      const config = await getBlockchainEnabled();
      blockchainEnabled = config.enabled;
    } catch (error) {
      console.error("Failed to get blockchain status:", error);
      blockchainEnabled = false;
    }
  }
  return blockchainEnabled;
};

export const checkMetaMaskInstalled = async (): Promise<boolean> => {
  return await getBlockchainStatus();
};

export const openMetaMask = async (): Promise<void> => {
  const enabled = await getBlockchainStatus();
  if (!enabled) {
    Alert.alert(
      "Info",
      "Blockchain is disabled. Operations will proceed without blockchain records.",
    );
  }
};

export const connectWallet = async (): Promise<boolean> => {
  return await getBlockchainStatus();
};

export const getBlockchainConfig = () => {
  return {
    contracts: {
      loanRegistry: process.env.EXPO_PUBLIC_BLOCKCHAIN_LOAN_REGISTRY,
      contractRegistry: process.env.EXPO_PUBLIC_BLOCKCHAIN_CONTRACT_REGISTRY,
      paymentRegistry: process.env.EXPO_PUBLIC_BLOCKCHAIN_PAYMENT_REGISTRY,
      kycRegistry: process.env.EXPO_PUBLIC_BLOCKCHAIN_KYC_REGISTRY,
      ruleRegistry: process.env.EXPO_PUBLIC_BLOCKCHAIN_RULE_REGISTRY,
    },
  };
};

export const showBlockchainInfo = (txHash?: string) => {
  if (!txHash) {
    Alert.alert("Info", "This record is stored off-chain only.");
    return;
  }

  // Direct redirect to explorer
  const explorerURL = `https://sepolia.etherscan.io/tx/${txHash}`;
  Linking.openURL(explorerURL).catch((error) => {
    console.error("Failed to open explorer URL:", error);
    Alert.alert("Error", "Could not open blockchain explorer");
  });
};

export const disconnectWallet = () => {
  console.log("Wallet disconnected");
};
