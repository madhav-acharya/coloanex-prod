export const recordLoanOnBlockchain = async (
  loanId: string,
  amountPaisa: number,
  interestRateBps: number,
  termMonths: number,
): Promise<string> => {
  throw new Error("MetaMask integration not available on mobile. Use WalletConnect or disable blockchain.");
};

export const recordContractOnBlockchain = async (
  contractId: string,
  loanId: string,
  borrowerAddress: string,
  lenderAddress: string,
): Promise<string> => {
  throw new Error("MetaMask integration not available on mobile. Use WalletConnect or disable blockchain.");
};

export const signContractOnBlockchain = async (
  contractId: string,
  signerRole: number,
): Promise<string> => {
  throw new Error("MetaMask integration not available on mobile. Use WalletConnect or disable blockchain.");
};

export const recordPaymentOnBlockchain = async (
  paymentId: string,
  loanId: string,
  amountPaisa: number,
): Promise<string> => {
  throw new Error("MetaMask integration not available on mobile. Use WalletConnect or disable blockchain.");
};
