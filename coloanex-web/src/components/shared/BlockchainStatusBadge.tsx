import { useToast } from "@/hooks/use-toast";

interface BlockchainStatusBadgeProps {
  blockchainTxHash?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BlockchainStatusBadge({
  blockchainTxHash,
  size = "sm",
  className = "",
}: BlockchainStatusBadgeProps) {
  const { toast } = useToast();
  const hasBlockchainTx = !!blockchainTxHash;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const handleClick = () => {
    if (hasBlockchainTx) {
      window.open(
        `https://sepolia.etherscan.io/tx/${blockchainTxHash}`,
        "_blank",
      );
    } else {
      toast({
        title: "Info",
        description: "This record is stored off-chain only.",
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        rounded-full font-medium transition-colors
        ${
          hasBlockchainTx
            ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
            : "bg-gray-100 text-gray-600 cursor-default"
        }
        ${className}
      `}
    >
      {hasBlockchainTx ? "On-Chain" : "Off-Chain"}
    </button>
  );
}
