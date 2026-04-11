import {
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
  useLookupPaymentMutation,
} from "@/apis/paymentsApi";
import type { TransactionType } from "@/apis/paymentsApi";

const STORAGE_KEY = "esewa_pending_payment";
const STORAGE_KEY_FALLBACK = "esewa_pending_payment_fallback";

interface PendingPayment {
  transactionUuid: string;
  amount: number;
  walletId?: string;
  type: string;
  gasPaymentMode?: "USER_WALLET" | "PLATFORM_WALLET";
  platform?: "WEB" | "APP";
  contractId?: string;
  paymentScheduleId?: string;
}

interface PayOptions {
  walletId?: string;
  contractId?: string;
  paymentScheduleId?: string;
  amount: number;
  type: TransactionType;
  gasPaymentMode?: "USER_WALLET" | "PLATFORM_WALLET";
  platform?: "WEB" | "APP";
  successPath?: string;
  failurePath?: string;
}

interface EsewaCallbackParams {
  transactionUuid: string;
  status: string;
}

function submitToEsewa(
  paymentUrl: string,
  formData: Record<string, string>,
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;

  Object.entries(formData).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

function storePendingPayment(data: PendingPayment): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(STORAGE_KEY_FALLBACK, JSON.stringify(data));
}

function readPendingPayment(): PendingPayment | null {
  const raw =
    sessionStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem(STORAGE_KEY_FALLBACK);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPayment;
  } catch {
    return null;
  }
}

function clearPendingPayment(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY_FALLBACK);
}

export function parseEsewaCallbackParams(): EsewaCallbackParams | null {
  const params = new URLSearchParams(window.location.search);
  const encodedData = params.get("data");
  if (encodedData) {
    try {
      const decoded = JSON.parse(atob(encodedData));
      const transactionUuid =
        decoded?.transaction_uuid || decoded?.transactionUuid;
      const status = decoded?.status;
      if (transactionUuid && status) {
        return { transactionUuid, status };
      }
    } catch {
      return null;
    }
  }

  const transactionUuid =
    params.get("transaction_uuid") || params.get("transactionUuid");
  const status = params.get("status");
  if (!transactionUuid || !status) return null;
  return { transactionUuid, status };
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
        gateway: "ESEWA",
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
          gateway: "ESEWA",
          ...(pending.walletId ? { walletId: pending.walletId } : {}),
          type: pending.type as any,
          ...(pending.gasPaymentMode
            ? { gasPaymentMode: pending.gasPaymentMode }
            : {}),
          ...(pending.platform ? { platform: pending.platform } : {}),
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

export function useEsewaPayment() {
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
      gasPaymentMode,
      platform,
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
      gasPaymentMode,
      platform,
      gateway: "ESEWA",
      successUrl,
      failureUrl,
    }).unwrap();

    storePendingPayment({
      transactionUuid: result.transactionUuid,
      amount,
      walletId: result.walletId ?? walletId,
      type,
      gasPaymentMode,
      platform,
      contractId,
      paymentScheduleId,
    });

    submitToEsewa(result.paymentUrl, result.formData);
  };

  const verifyFromCallback = async () => {
    const pending = readPendingPayment();
    const callbackParams = parseEsewaCallbackParams();

    if (!pending) {
      return { success: false, transactionId: null, status: "FAILED" };
    }

    const transactionUuid =
      callbackParams?.transactionUuid || pending.transactionUuid;
    const callbackStatus = callbackParams?.status;

    if (!transactionUuid) {
      return { success: false, transactionId: null, status: "FAILED" };
    }

    if (callbackStatus === "COMPLETE" || callbackStatus === "Completed") {
      try {
        const verifyResult = await verifyPayment({
          transactionUuid,
          totalAmount: pending.amount,
          gateway: "ESEWA",
          ...(pending.walletId ? { walletId: pending.walletId } : {}),
          type: pending.type as any,
          ...(pending.gasPaymentMode
            ? { gasPaymentMode: pending.gasPaymentMode }
            : {}),
          ...(pending.platform ? { platform: pending.platform } : {}),
          contractId: pending.contractId,
          paymentScheduleId: pending.paymentScheduleId,
        }).unwrap();
        if (verifyResult?.success) {
          clearPendingPayment();
        }
        return verifyResult;
      } catch (error) {
        const lookupResult = await pollLookup(
          lookupPayment,
          transactionUuid,
          pending.amount,
          pending,
          verifyPayment,
        );
        if (lookupResult?.success) {
          clearPendingPayment();
        }
        return lookupResult;
      }
    }

    const lookupResult = await pollLookup(
      lookupPayment,
      transactionUuid,
      pending.amount,
      pending,
      verifyPayment,
    );
    if (lookupResult?.success) {
      clearPendingPayment();
    }
    return lookupResult;
  };

  return {
    pay,
    verifyFromCallback,
    isInitiating,
    isVerifying: isVerifying || isLookingUp,
  };
}
