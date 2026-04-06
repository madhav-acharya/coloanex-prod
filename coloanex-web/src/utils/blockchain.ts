import { ethers } from "ethers";

const LOAN_REGISTRY_ADDRESS = import.meta.env.VITE_BLOCKCHAIN_LOAN_REGISTRY || '0xBb6Af7Cf2BB292605C521ecC0b1daAD9bfB6967E';
const CONTRACT_REGISTRY_ADDRESS = import.meta.env.VITE_BLOCKCHAIN_CONTRACT_REGISTRY || '0xC0b84bb79f7A73b47F5682f9698FddC40a17243e';
const PAYMENT_REGISTRY_ADDRESS = import.meta.env.VITE_BLOCKCHAIN_PAYMENT_REGISTRY || '0x299f8F46AcBAaB755741D33CcEF08ed8aa392543';
const KYC_REGISTRY_ADDRESS = import.meta.env.VITE_BLOCKCHAIN_KYC_REGISTRY || '0x66Fca2F2d7B5E7D6d7dF158AF7f4765920BC68F4';

const LOAN_REGISTRY_ABI = [
  "function createLoan(string loanId, uint256 amountPaisa, uint256 interestRateBps, uint256 termMonths, address borrower, address lender) external",
  "function updateLoanStatus(string loanId, uint256 status) external",
  "function deleteLoan(string loanId) external",
];

const CONTRACT_REGISTRY_ABI = [
  "function createContract(string contractId, string loanId, uint256 loanAmountPaisa, uint256 interestRateBps, uint256 termMonths, uint256 totalAmountDuePaisa) external",
  "function signContract(string contractId) external",
  "function updateContractStatus(string contractId, uint256 status) external",
  "function deleteContract(string contractId) external",
];

const PAYMENT_REGISTRY_ABI = [
  "function recordPayment(string paymentId, string contractId, uint256 amountPaisa, string paymentMethod, string gatewayRef) external",
  "function updatePaymentStatus(string paymentId, uint256 status) external",
];

const KYC_REGISTRY_ABI = [
  "function verifyKYC(string kycId, address user, string status, string verifiedBy) external",
  "function updateKYCStatus(string kycId, string status) external",
  "function getKYC(string kycId) external view returns (tuple(string kycId, address user, string status, uint256 timestamp, string verifiedBy))",
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

export const updateLoanOnBlockchain = async (
  loanId: string,
  amountPaisa: number,
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

  const tx = await contract.updateLoanStatus(loanId, BigInt(1));
  const receipt = await tx.wait();
  return receipt.hash;
};

export const deleteLoanOnBlockchain = async (
  loanId: string,
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

  const tx = await contract.deleteLoan(loanId);
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

export const recordKYCOnBlockchain = async (
  kycId: string,
  userAddress: string,
  status: string = "PENDING",
  verifiedBy: string = "System",
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    KYC_REGISTRY_ADDRESS,
    KYC_REGISTRY_ABI,
    signer,
  );

  const tx = await contract.verifyKYC(kycId, userAddress, status, verifiedBy);

  const receipt = await tx.wait();
  return receipt.hash;
};

export const updateKYCOnBlockchain = async (
  kycId: string,
  status: string,
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    KYC_REGISTRY_ADDRESS,
    KYC_REGISTRY_ABI,
    signer,
  );

  const tx = await contract.updateKYCStatus(kycId, status);

  const receipt = await tx.wait();
  return receipt.hash;
};
