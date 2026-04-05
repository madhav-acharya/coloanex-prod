import { ethers } from "ethers";

const LOAN_REGISTRY_ADDRESS = import.meta.env.VITE_BLOCKCHAIN_LOAN_REGISTRY;
const CONTRACT_REGISTRY_ADDRESS = import.meta.env
  .VITE_BLOCKCHAIN_CONTRACT_REGISTRY;
const PAYMENT_REGISTRY_ADDRESS = import.meta.env
  .VITE_BLOCKCHAIN_PAYMENT_REGISTRY;

const LOAN_REGISTRY_ABI = [
  "function createLoan(string loanId, uint256 amountPaisa, uint256 interestRateBps, uint256 termMonths, address borrower, address lender) external",
];

const CONTRACT_REGISTRY_ABI = [
  "function createContract(string contractId, string loanId, uint256 loanAmountPaisa, uint256 interestRateBps, uint256 termMonths, uint256 totalAmountDuePaisa) external",
  "function signContract(string contractId) external",
];

const PAYMENT_REGISTRY_ABI = [
  "function recordPayment(string paymentId, string contractId, uint256 amountPaisa, string paymentMethod, string gatewayRef) external",
];

export const recordLoanOnBlockchain = async (
  loanId: string,
  amountPaisa: number,
  interestRateBps: number,
  termMonths: number,
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    LOAN_REGISTRY_ADDRESS,
    LOAN_REGISTRY_ABI,
    signer,
  );

  const tx = await contract.createLoan(
    loanId,
    BigInt(amountPaisa),
    BigInt(interestRateBps),
    BigInt(termMonths),
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000",
  );

  const receipt = await tx.wait();
  return receipt.hash;
};

export const recordContractOnBlockchain = async (
  contractId: string,
  loanId: string,
  loanAmountPaisa: number,
  interestRateBps: number,
  termMonths: number,
  totalAmountDuePaisa: number,
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    CONTRACT_REGISTRY_ADDRESS,
    CONTRACT_REGISTRY_ABI,
    signer,
  );

  const tx = await contract.createContract(
    contractId,
    loanId,
    BigInt(loanAmountPaisa),
    BigInt(interestRateBps),
    BigInt(termMonths),
    BigInt(totalAmountDuePaisa),
  );

  const receipt = await tx.wait();
  return receipt.hash;
};

export const signContractOnBlockchain = async (
  contractId: string,
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    CONTRACT_REGISTRY_ADDRESS,
    CONTRACT_REGISTRY_ABI,
    signer,
  );

  const tx = await contract.signContract(contractId);

  const receipt = await tx.wait();
  return receipt.hash;
};

export const recordPaymentOnBlockchain = async (
  paymentId: string,
  contractId: string,
  amountPaisa: number,
  paymentMethod: string,
  gatewayRef: string,
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    PAYMENT_REGISTRY_ADDRESS,
    PAYMENT_REGISTRY_ABI,
    signer,
  );

  const tx = await contract.recordPayment(
    paymentId,
    contractId,
    BigInt(amountPaisa),
    paymentMethod,
    gatewayRef,
  );

  const receipt = await tx.wait();
  return receipt.hash;
};
