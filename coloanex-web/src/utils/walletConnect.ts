import EthereumProvider from "@walletconnect/ethereum-provider";

export async function connectWalletConnect(): Promise<string> {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as
    | string
    | undefined;

  if (!projectId) {
    throw new Error(
      "WalletConnect is not configured. Set VITE_WALLETCONNECT_PROJECT_ID.",
    );
  }

  const provider = await EthereumProvider.init({
    projectId,
    chains: [11155111],
    showQrModal: true,
    optionalChains: [1],
  });

  await provider.connect();
  const accounts = (provider.accounts || []) as string[];
  const address = accounts[0];

  if (!address) {
    throw new Error("WalletConnect did not return an account.");
  }

  return address;
}
