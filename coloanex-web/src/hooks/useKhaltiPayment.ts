import {
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
  useLookupPaymentMutation,
} from "@/apis/paymentsApi";
import type { TransactionType } from "@/apis/paymentsApi";

const STORAGE_KEY = "khalti_pending_payment";

interface PendingPayment {
  transactionUuid: string;
  amount: number;
  walletId: string;
  type: string;
  contractId?: string;
  paymentScheduleId?: string;
}

interface PayOptions {
  walletId: string;
  contractId?: string;
  paymentScheduleId?: string;
  amount: number;
  type: TransactionType;
  successPath?: string;
  failurePath?: string;
}

interface KhaltiCallbackParams {
  pidx: string;
  status: string;
}

function storePendingPayment(data: PendingPayment): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function consumePendingPayment(): PendingPayment | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as PendingPayment;
  } catch {
    return null;
  }
}

export function parseKhaltiCallbackParams(): KhaltiCallbackParams | null {
  const params = new URLSearchParams(window.location.search);
  const pidx = params.get("pidx");
  const status = params.get("status");
  if (!pidx || !status) return null;
  return { pidx, status };
}

async function pollLookup(
  lookupPayment: any,
  transactionUuid: string,
  amount: number,
  pending: PendingPayment,
  verifyPayment: any,
  maxAttempts = 10,
): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const lookupResult = await lookupPayment({
        transactionUuid,
        totalAmount: amount,
        gateway: "KHALTI",
      }).unwrap();

      if (lookupResult.status === "COMPLETED") {
        if (lookupResult.alreadyProcessed) {
          return {
            success: true,
            transactionId: lookupResult.transactionId,
            status: "COMPLETED",
          };
        }

        return verifyPayment({
          transactionUuid,
          totalAmount: amount,
          gateway: "KHALTI",
          walletId: pending.walletId,
          type: pending.type as any,
          contractId: pending.contractId,
          paymentScheduleId: pending.paymentScheduleId,
        }).unwrap();
      } else if (
        lookupResult.status === "FAILED" ||
        lookupResult.status === "EXPIRED"
      ) {
        return { success: false, transactionId: null, status: "FAILED" };
      }

      // PENDING or REFUNDED - wait and retry
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return { success: false, transactionId: null, status: "FAILED" };
}

export function useKhaltiPayment() {
  const [initiatePayment, { isLoading: isInitiating }] =
    useInitiatePaymentMutation();
  const [verifyPayment, { isLoading: isVerifying }] =
    useVerifyPaymentMutation();
  const [lookupPayment, { isLoading: isLookingUp }] =
    useLookupPaymentMutation();

  const pay = async (options: PayOptions): Promise<void> => {
    const {
      walletId,
      contractId,
      paymentScheduleId,
      amount,
      type,
      successPath = "/payment/success",
      failurePath = "/payment/failure",
    } = options;

    const successUrl = `${window.location.origin}${successPath}`;
    const failureUrl = `${window.location.origin}${failurePath}`;

    const result = await initiatePayment({
      walletId,
      contractId,
      paymentScheduleId,
      amount,
      type,
      gateway: "KHALTI",
      successUrl,
      failureUrl,
    }).unwrap();

    storePendingPayment({
      transactionUuid: result.transactionUuid,
      amount,
      walletId: result.walletId ?? walletId,
      type,
      contractId,
      paymentScheduleId,
    });

    window.location.href = result.paymentUrl;
  };

  const verifyFromCallback = async () => {
    const pending = consumePendingPayment();
    const callbackParams = parseKhaltiCallbackParams();

    if (!pending || !callbackParams) {
      return { success: false, transactionId: null, status: "FAILED" };
    }

    // Try direct verification first
    if (callbackParams.status === "Completed") {
      try {
        return await verifyPayment({
          transactionUuid: callbackParams.pidx,
          totalAmount: pending.amount,
          gateway: "KHALTI",
          walletId: pending.walletId,
          type: pending.type as any,
          contractId: pending.contractId,
          paymentScheduleId: pending.paymentScheduleId,
        }).unwrap();
      } catch (error) {
        // If verification fails, try lookup as fallback
        return pollLookup(
          lookupPayment,
          callbackParams.pidx,
          pending.amount,
          pending,
          verifyPayment,
        );
      }
    }

    // If status is not Completed, use lookup to check actual status
    return pollLookup(
      lookupPayment,
      callbackParams.pidx,
      pending.amount,
      pending,
      verifyPayment,
    );
  };

  return {
    pay,
    verifyFromCallback,
    isInitiating,
    isVerifying: isVerifying || isLookingUp,
  };
}
