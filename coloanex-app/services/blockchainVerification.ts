import AsyncStorage from "@react-native-async-storage/async-storage";

export interface BlockchainVerificationResult {
  isVerified: boolean;
  onChain: boolean;
  transactionHash?: string;
  blockNumber?: string;
  timestamp?: string;
  confirmations?: number;
  error?: string;
  chainData?: {
    mspId: string;
    channelName: string;
    chaincodeName: string;
    functionName: string;
    [key: string]: any;
  };
}

export interface BlockchainRecord {
  id: string;
  type: "loan" | "contract" | "payment";
  status: string;
  amount?: number;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
  details: Record<string, any>;
}

class BlockchainVerificationService {
  async verifyRecord(
    record: BlockchainRecord,
  ): Promise<BlockchainVerificationResult> {
    try {
      if (!record.transactionHash) {
        return {
          isVerified: false,
          onChain: false,
          error: "No blockchain transaction hash found",
        };
      }

      const isEnabled = await this.isBlockchainEnabled();
      if (!isEnabled) {
        return {
          isVerified: false,
          onChain: false,
          error: "Blockchain verification is currently disabled",
        };
      }

      const response = await this.callVerificationAPI(record);

      if (response.success) {
        return {
          isVerified: response.isVerified,
          onChain: response.onChain,
          transactionHash: response.transactionHash,
          blockNumber: response.blockNumber,
          timestamp: response.timestamp,
          confirmations: response.confirmations,
          chainData: response.chainData,
        };
      } else {
        return {
          isVerified: false,
          onChain: false,
          error: response.error || "Transaction not found on blockchain",
        };
      }
    } catch (error) {
      return this.createErrorResult("Failed to verify blockchain transaction");
    }
  }

  private async callVerificationAPI(record: BlockchainRecord): Promise<any> {
    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.22:3000/api"}/${record.type}s/blockchain/verify/${record.id}`;

      const token = await AsyncStorage.getItem("token");
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: data.success || false,
          isVerified: data.isVerified || false,
          onChain: data.onChain || false,
          transactionHash: data.transactionHash,
          blockNumber: data.blockNumber,
          timestamp: data.timestamp,
          confirmations: data.confirmations,
          chainData: data.chainData,
          error: data.error,
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: "Verification endpoint not found",
        };
      }

      if (response.status === 401) {
        return {
          success: false,
          error: "Unauthorized - please login again",
        };
      }

      return {
        success: false,
        error: `API error: ${response.status} ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private createErrorResult(error: string): BlockchainVerificationResult {
    return {
      isVerified: false,
      onChain: false,
      error,
    };
  }

  async isBlockchainEnabled(): Promise<boolean> {
    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.22:3000/api"}/blockchain/health`;
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.enabled === true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}

export const blockchainVerificationService =
  new BlockchainVerificationService();
