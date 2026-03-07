import {
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
} from "@/apis/paymentsApi";
import type { TransactionType } from "@/apis/paymentsApi";

const STORAGE_KEY = "esewa_pending_payment";

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

export function parseEsewaCallbackParams(): EsewaCallbackParams | null {
  const params = new URLSearchParams(window.location.search);
  const transactionUuid = params.get("transaction_uuid");
  const status = params.get("status");
  if (!transactionUuid || !status) return null;
  return { transactionUuid, status };
}

export function useEsewaPayment() {
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
      gateway: "ESEWA",
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

    submitToEsewa(result.paymentUrl, result.formData);
  };

  const verifyFromCallback = async () => {
    const pending = consumePendingPayment();
    const callbackParams = parseEsewaCallbackParams();

    if (!pending || !callbackParams) {
      return { success: false, transactionId: null, status: "FAILED" };
    }

    if (callbackParams.status !== "COMPLETE") {
      await verifyPayment({
        transactionUuid: pending.transactionUuid,
        totalAmount: pending.amount,
        gateway: "ESEWA",
        walletId: pending.walletId,
        type: pending.type as any,
        contractId: pending.contractId,
        paymentScheduleId: pending.paymentScheduleId,
      }).unwrap();
      return { success: false, transactionId: null, status: "FAILED" };
    }

    return verifyPayment({
      transactionUuid: callbackParams.transactionUuid,
      totalAmount: pending.amount,
      gateway: "ESEWA",
      walletId: pending.walletId,
      type: pending.type as any,
      contractId: pending.contractId,
      paymentScheduleId: pending.paymentScheduleId,
    }).unwrap();
  };

  return {
    pay,
    verifyFromCallback,
    isInitiating,
    isVerifying,
  };
}
