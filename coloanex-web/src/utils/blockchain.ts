import { ethers } from "ethers";
import { isWebPlatform } from "./platform";

const LOAN_REGISTRY_ADDRESS =
  import.meta.env.VITE_BLOCKCHAIN_LOAN_REGISTRY ||
  "0xBb6Af7Cf2BB292605C521ecC0b1daAD9bfB6967E";
const CONTRACT_REGISTRY_ADDRESS =
  import.meta.env.VITE_BLOCKCHAIN_CONTRACT_REGISTRY ||
  "0xC0b84bb79f7A73b47F5682f9698FddC40a17243e";
const PAYMENT_REGISTRY_ADDRESS =
  import.meta.env.VITE_BLOCKCHAIN_PAYMENT_REGISTRY ||
  "0x299f8F46AcBAaB755741D33CcEF08ed8aa392543";
const KYC_REGISTRY_ADDRESS =
  import.meta.env.VITE_BLOCKCHAIN_KYC_REGISTRY ||
  "0x66Fca2F2d7B5E7D6d7dF158AF7f4765920BC68F4";

const LOAN_REGISTRY_ABI = [
  "function createLoan(string loanId, uint256 amount, uint256 interestRate, uint256 termMonths, address borrower, address lender) external",
  "function updateLoanStatus(string loanId, string newStatus) external",
  "function getLoan(string loanId) external view returns (tuple(string loanId, uint256 amount, uint256 interestRate, uint256 termMonths, address borrower, address lender, string status, uint256 createdAt, uint256 updatedAt))",
];

const CONTRACT_REGISTRY_ABI = [
  "function createContract(string contractId, string loanId, uint256 loanAmountPaisa, uint256 interestRateBps, uint256 termMonths, uint256 totalAmountDuePaisa) external",
  "function signContract(string contractId) external",
  "function updateContractStatus(string contractId, string status) external",
  "function deleteContract(string contractId) external",
];

const PAYMENT_REGISTRY_ABI = [
  "function recordPayment(string paymentId, string contractId, uint256 amountPaisa, string paymentMethod, string gatewayRef) external",
  "function updatePaymentStatus(string paymentId, uint256 status) external",
];

const KYC_REGISTRY_ABI = [
  "function verifyKYC(string kycId, address user, string status, string verifiedBy) external",
  "function updateKYCStatus(string kycId, string status) external",
  "function deleteKYC(string kycId) external",
  "function getKYC(string kycId) external view returns (tuple(string kycId, address user, string status, uint256 timestamp, string verifiedBy))",
];

export const recordLoanOnBlockchain = async (
  loanId: string,
  amount: number,
  interestRate: number,
  termMonths: number,
): Promise<string> => {
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  const contract = new ethers.Contract(
    LOAN_REGISTRY_ADDRESS,
    LOAN_REGISTRY_ABI,
    signer,
  );

  const tx = await contract.createLoan(
    loanId,
    BigInt(amount),
    BigInt(interestRate),
    BigInt(termMonths),
    userAddress,
    userAddress,
  );

  const receipt = await tx.wait();
  return receipt.hash;
};

export const createLoanOnBlockchain = async (loanId: string): Promise<string> => {
  console.log('createLoanOnBlockchain called with loanId:', loanId);
  
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (!window.ethereum) {
    console.error('MetaMask not found');
    throw new Error("MetaMask is not installed");
  }

  console.log('Creating provider...');
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  console.log('Requesting accounts...');
  await provider.send("eth_requestAccounts", []);
  
  console.log('Getting signer...');
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  console.log('Creating contract with address:', LOAN_REGISTRY_ADDRESS);
  const contract = new ethers.Contract(
    LOAN_REGISTRY_ADDRESS,
    LOAN_REGISTRY_ABI,
    signer,
  );

  console.log('Calling createLoan...');
  const tx = await contract.createLoan(
    loanId,
    BigInt(100000),
    BigInt(1200),
    BigInt(12),
    userAddress,
    userAddress,
  );
  console.log('Transaction sent:', tx.hash);
  
  console.log('Waiting for receipt...');
  const receipt = await tx.wait();
  console.log('Transaction confirmed:', receipt.hash);
  
  return receipt.hash;
};

export const updateLoanStatusOnBlockchain = async (
  loanId: string,
  status: string,
): Promise<string> => {
  console.log('updateLoanStatusOnBlockchain called with:', { loanId, status });
  
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (!window.ethereum) {
    console.error('MetaMask not found');
    throw new Error("MetaMask is not installed");
  }

  console.log('Creating provider...');
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  console.log('Requesting accounts...');
  await provider.send("eth_requestAccounts", []);
  
  console.log('Getting signer...');
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  console.log('Creating contract with address:', LOAN_REGISTRY_ADDRESS);
  const contract = new ethers.Contract(
    LOAN_REGISTRY_ADDRESS,
    LOAN_REGISTRY_ABI,
    signer,
  );

  console.log('Calling updateLoanStatus with string status:', status);
  
  try {
    console.log('Calling updateLoanStatus on contract...');
    const tx = await contract.updateLoanStatus(loanId, status);
    console.log('Transaction sent:', tx.hash);
    
    console.log('Waiting for receipt...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);
    
    return receipt.hash;
  } catch (error: any) {
    console.log('Update failed, trying to create loan first. Error:', error.message);
    
    if (error.code === "CALL_EXCEPTION") {
      console.log('Creating loan on blockchain first...');
      const createTx = await contract.createLoan(
        loanId,
        BigInt(100000),
        BigInt(1200),
        BigInt(12),
        userAddress,
        userAddress,
      );
      console.log('Create transaction sent:', createTx.hash);
      await createTx.wait();
      console.log('Loan created, now updating status...');
      
      const updateTx = await contract.updateLoanStatus(loanId, status);
      console.log('Update transaction sent:', updateTx.hash);
      const updateReceipt = await updateTx.wait();
      console.log('Status update confirmed:', updateReceipt.hash);
      return updateReceipt.hash;
    }
    
    throw error;
  }
};

export const updateLoanOnBlockchain = async (
  loanId: string,
  amountPaisa: number,
  termMonths: number,
): Promise<string> => {
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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

export const deleteKYCOnBlockchain = async (
  kycId: string,
): Promise<string> => {
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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

  const tx = await contract.deleteKYC(kycId);

  const receipt = await tx.wait();
  return receipt.hash;
};

export const updatePaymentStatusOnBlockchain = async (
  paymentId: string,
  status: string,
): Promise<string> => {
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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

  const statusMap: Record<string, number> = {
    PENDING: 0,
    COMPLETED: 1,
    FAILED: 2,
    REFUNDED: 3,
  };

  const statusCode = statusMap[status] || 0;
  const tx = await contract.updatePaymentStatus(paymentId, BigInt(statusCode));

  const receipt = await tx.wait();
  return receipt.hash;
};

export const recordTransactionOnBlockchain = async (
  transactionId: string,
  contractId: string,
  amount: number,
  transactionType: string,
): Promise<string> => {
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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
    transactionId,
    contractId,
    BigInt(amount * 100),
    transactionType,
    "blockchain",
  );

  const receipt = await tx.wait();
  return receipt.hash;
};

export const updateContractStatusOnBlockchain = async (
  contractId: string,
  status: string,
): Promise<string> => {
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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

  const tx = await contract.updateContractStatus(contractId, status);

  const receipt = await tx.wait();
  return receipt.hash;
};

export const deleteContractOnBlockchain = async (
  contractId: string,
): Promise<string> => {
  if (!isWebPlatform()) {
    return `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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

  const tx = await contract.deleteContract(contractId);

  const receipt = await tx.wait();
  return receipt.hash;
};
