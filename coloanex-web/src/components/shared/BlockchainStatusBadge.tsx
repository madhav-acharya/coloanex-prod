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
      className={`${sizeClasses[size] || sizeClasses.sm} font-bold uppercase tracking-wider rounded-md border transition-all ${className} ${
        hasBlockchainTx
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
          : "bg-destructive/10 text-destructive border-destructive/20 cursor-default"
      }`}
      title={hasBlockchainTx ? "View on Blockchain" : "Off-chain record"}
    >
      <span className="flex items-center gap-1.5">
        {hasBlockchainTx ? "On-Chain" : "Off-Chain"}
      </span>
    </button>
  );
}
