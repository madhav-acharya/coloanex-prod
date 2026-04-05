/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EVM_LOAN_REGISTRY_ADDRESS?: string;
  readonly VITE_EVM_CONTRACT_REGISTRY_ADDRESS?: string;
  readonly VITE_EVM_PAYMENT_REGISTRY_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: any;
}
