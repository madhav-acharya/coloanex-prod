import {
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
} from "@/apis/paymentsApi";
import type { TransactionType } from "@/apis/paymentsApi";

const STORAGE_KEY = "khalti_pending_payment";

interface PendingPayment {
  transactionId: string;
  amount: number;
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

export function useKhaltiPayment() {
  const [initiatePayment, { isLoading: isInitiating }] =
    useInitiatePaymentMutation();
  const [verifyPayment, { isLoading: isVerifying }] =
    useVerifyPaymentMutation();

  const pay = async (options: PayOptions): Promise<void> => {
    const {
      walletId,
      contractId,
      paymentScheduleId,
      amount,
      type,
      successPath = "/wallets?payment=success",
      failurePath = "/wallets?payment=failed",
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
      transactionId: result.transactionId,
      amount,
    });

    window.location.href = result.paymentUrl;
  };

  const verifyFromCallback = async () => {
    const pending = consumePendingPayment();
    const callbackParams = parseKhaltiCallbackParams();

    if (!pending || !callbackParams) {
      return { success: false, transactionId: null, status: "FAILED" };
    }

    if (callbackParams.status !== "Completed") {
      await verifyPayment({
        transactionId: pending.transactionId,
        transactionUuid: callbackParams.pidx,
        totalAmount: pending.amount,
      }).unwrap();
      return {
        success: false,
        transactionId: pending.transactionId,
        status: "FAILED",
      };
    }

    return verifyPayment({
      transactionId: pending.transactionId,
      transactionUuid: callbackParams.pidx,
      totalAmount: pending.amount,
    }).unwrap();
  };

  return {
    pay,
    verifyFromCallback,
    isInitiating,
    isVerifying,
  };
}
