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

      if (!this.validateTransactionHash(record.transactionHash)) {
        return {
          isVerified: false,
          onChain: false,
          error: "Invalid transaction hash format",
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
          transactionHash: response.transactionHash || record.transactionHash,
          blockNumber: response.blockNumber,
          timestamp: response.timestamp,
          confirmations: response.confirmations,
          chainData: response.chainData || {
            mspId: response.mspId,
            channelName: this.getChannelName(record.type),
            chaincodeName: this.getChaincodeName(record.type),
            functionName: this.getFunctionName(record.type),
          },
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
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
      const url = `${apiBaseUrl}/${record.type}s/blockchain/verify/${record.id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          return {
            success: true,
            isVerified: data.isVerified,
            onChain: data.onChain,
            transactionHash: data.transactionHash,
            blockNumber: data.blockNumber,
            timestamp: data.timestamp,
            confirmations: data.confirmations,
            chainData: data.chainData,
            mspId: data.mspId,
          };
        } else {
          return {
            success: false,
            isVerified: false,
            onChain: false,
            error: data.error || "Transaction not found on blockchain",
          };
        }
      }

      if (response.status === 404) {
        return {
          success: false,
          error: `Verification endpoint not found: ${url}`,
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

  private getChannelName(type: string): string {
    switch (type) {
      case "loan":
        return "loans-channel";
      case "contract":
        return "contracts-channel";
      case "payment":
        return "payments-channel";
      default:
        return "default-channel";
    }
  }

  private getChaincodeName(type: string): string {
    switch (type) {
      case "loan":
        return "loans-chaincode";
      case "contract":
        return "contracts-chaincode";
      case "payment":
        return "payments-chaincode";
      default:
        return "default-chaincode";
    }
  }

  private getFunctionName(type: string): string {
    switch (type) {
      case "loan":
        return "createLoan";
      case "contract":
        return "createContract";
      case "payment":
        return "recordPayment";
      default:
        return "createRecord";
    }
  }

  validateTransactionHash(hash: string): boolean {
    if (!hash || typeof hash !== "string") return false;
    const trimmed = hash.trim();
    if (trimmed.length < 32 || trimmed.length > 128) return false;
    const hexPattern = /^[0-9a-fA-F]+$/;
    return hexPattern.test(trimmed);
  }

  async isBlockchainEnabled(): Promise<boolean> {
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
      const url = `${apiBaseUrl}/blockchain/health`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        credentials: "include",
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
