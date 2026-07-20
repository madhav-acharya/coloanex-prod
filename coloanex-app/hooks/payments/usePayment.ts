import { useState, useCallback } from "react";
import { paymentsApi } from "@/api/paymentsApi";
import type { PaymentGateway, TransactionType } from "@/api/paymentsApi";

export interface UsePaymentResult {
  initiate: (options: InitiateOptions) => Promise<InitiateResult>;
  verify: (options: VerifyOptions) => Promise<boolean>;
  lookup: (
    transactionUuid: string,
    totalAmount?: number,
  ) => Promise<LookupResult>;
  isProcessing: boolean;
}

export interface InitiateOptions {
  contractId?: string;
  paymentScheduleId?: string;
  amount: number;
  type: TransactionType;
  successUrl: string;
  failureUrl: string;
  gasPaymentMode?: "USER_WALLET" | "PLATFORM_WALLET";
  platform?: "WEB" | "APP";
}

export interface InitiateResult {
  transactionUuid: string;
  paymentUrl: string;
  formData: Record<string, string>;
}

export interface VerifyOptions {
  transactionUuid: string;
  totalAmount: number;
  type: TransactionType;
  contractId?: string;
  paymentScheduleId?: string;
  gasPaymentMode?: "USER_WALLET" | "PLATFORM_WALLET";
  platform?: "WEB" | "APP";
}

export interface LookupResult {
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED" | "EXPIRED";
  alreadyProcessed: boolean;
  transactionId: string | null;
}

export const usePayment = (gateway: PaymentGateway): UsePaymentResult => {
  const [isProcessing, setIsProcessing] = useState(false);

  const initiate = useCallback(
    async (options: InitiateOptions): Promise<InitiateResult> => {
      setIsProcessing(true);
      try {
        const result = await paymentsApi.initiatePayment({
          ...options,
          gateway,
          gasPaymentMode: options.gasPaymentMode ?? "PLATFORM_WALLET",
          platform: options.platform ?? "APP",
        });
        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [gateway],
  );

  const verify = useCallback(
    async (options: VerifyOptions): Promise<boolean> => {
      setIsProcessing(true);
      try {
        const result = await paymentsApi.verifyPayment({
          ...options,
          gateway,
          gasPaymentMode: options.gasPaymentMode ?? "PLATFORM_WALLET",
          platform: options.platform ?? "APP",
        });
        return result.success;
      } finally {
        setIsProcessing(false);
      }
    },
    [gateway],
  );

  const lookup = useCallback(
    async (
      transactionUuid: string,
      totalAmount?: number,
    ): Promise<LookupResult> => {
      setIsProcessing(true);
      try {
        const result = await paymentsApi.lookupPayment({
          transactionUuid,
          totalAmount,
          gateway,
        });
        return {
          status: result.status,
          alreadyProcessed: result.alreadyProcessed,
          transactionId: result.transactionId,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [gateway],
  );

  return {
    initiate,
    verify,
    lookup,
    isProcessing,
  };
};

export const useKhaltiPayment = () => usePayment("KHALTI");
export const useEsewaPayment = () => usePayment("ESEWA");
