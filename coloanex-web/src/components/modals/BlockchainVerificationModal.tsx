import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { useToast } from "@/hooks/use-toast";
import {
  blockchainVerificationService,
  type BlockchainRecord,
  type BlockchainVerificationResult,
} from "@/services/blockchainVerification";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: BlockchainRecord | null;
}

export function BlockchainVerificationModal({
  open,
  onOpenChange,
  record,
}: Props) {
  const { toast } = useToast();
  const [verification, setVerification] =
    useState<BlockchainVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (open && record) {
      verifyBlockchainRecord();
    }
  }, [open, record?.transactionHash]);

  const verifyBlockchainRecord = async () => {
    if (!record) return;

    setIsVerifying(true);
    setVerification(null);

    try {
      const result = await blockchainVerificationService.verifyRecord(record);
      setVerification(result);

      // Remove the success toast for verification
    } catch (error) {
      setVerification({
        isVerified: false,
        onChain: false,
        error: "Failed to connect to blockchain verification service",
      });

      toast({
        title: "Verification Error",
        description: "Unable to verify blockchain transaction at this time",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewOnExplorer = () => {
    const transactionHash = record?.transactionHash || verification?.transactionHash;
    if (transactionHash) {
      const explorerUrl = `http://localhost:8080/?tab=transactions&transId=${transactionHash}`;
      window.open(explorerUrl, '_blank');
    }
  };

  const getVerificationIcon = () => {
    if (isVerifying)
      return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    if (!verification) return null;

    if (verification.isVerified && verification.onChain) {
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    } else {
      return verification.error ? (
        <XCircle className="w-5 h-5 text-red-500" />
      ) : (
        <AlertCircle className="w-5 h-5 text-amber-500" />
      );
    }
  };

  const getVerificationStatus = () => {
    if (isVerifying) return "Verifying...";
    if (!verification) return "";

    if (verification.isVerified && verification.onChain) {
      return "Verified on Blockchain";
    } else if (verification.error) {
      return "Verification Failed";
    } else {
      return "Not on Blockchain";
    }
  };

  const getStatusBadgeColor = () => {
    if (!record) return "bg-muted text-muted-foreground border border-border";

    switch (record.status.toLowerCase()) {
      case "completed":
      case "paid":
      case "active":
      case "approved":
        return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-600";
      case "pending":
      case "under_review":
      case "submitted":
        return "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200 border border-amber-300 dark:border-amber-600";
      case "rejected":
      case "cancelled":
      case "failed":
        return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-600";
      case "draft":
        return "bg-muted text-muted-foreground border border-border";
      default:
        return "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Blockchain Verification
            {getVerificationIcon()}
          </DialogTitle>
        </DialogHeader>

        {record && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg border shadow-sm">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Type
                </p>
                <p className="font-medium text-foreground capitalize">
                  {record.type}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge className={getStatusBadgeColor()}>
                  {record.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Blockchain TxID
                </p>
                <p className="font-mono text-sm text-foreground break-all">
                  {record.transactionHash || "Not recorded on blockchain"}
                </p>
              </div>
              {record.amount && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Amount
                  </p>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <IconCurrencyRupeeNepalese className="inline h-4 w-4" />
                    {record.amount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4 bg-card shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  Blockchain Verification
                </h3>
                <div className="flex items-center gap-2">
                  {getVerificationIcon()}
                  <span className="text-sm font-medium text-foreground">
                    {getVerificationStatus()}
                  </span>
                </div>
              </div>

              {verification && (
                <div className="space-y-3">
                  {verification.isVerified && verification.onChain ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Transaction Hash
                          </p>
                          <p className="font-mono break-all text-foreground">
                            {verification.transactionHash}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Block Number</p>
                          <p className="font-mono text-foreground">
                            {verification.blockNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confirmations</p>
                          <p className="font-mono text-foreground">
                            {verification.confirmations}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Timestamp</p>
                          <p className="text-sm text-foreground">
                            {verification.timestamp
                              ? new Date(
                                  verification.timestamp,
                                ).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      {verification.chainData && (
                        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-600 rounded">
                          <h4 className="font-medium text-emerald-700 dark:text-emerald-100 mb-2">
                            Hyperledger Fabric Details
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm text-emerald-700 dark:text-emerald-100">
                            <div>
                              <span className="font-medium">MSP ID:</span>{" "}
                              {verification.chainData.mspId}
                            </div>
                            <div>
                              <span className="font-medium">Channel:</span>{" "}
                              {verification.chainData.channelName}
                            </div>
                            <div>
                              <span className="font-medium">Chaincode:</span>{" "}
                              {verification.chainData.chaincodeName}
                            </div>
                            <div>
                              <span className="font-medium">Function:</span>{" "}
                              {verification.chainData.functionName}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : verification.error ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-600 rounded-lg">
                      <p className="text-red-700 dark:text-red-100 font-semibold text-sm">
                        {verification.error}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-600 rounded-lg">
                      <p className="text-amber-700 dark:text-amber-100 font-medium text-sm">
                        This record exists in the database but has not been
                        recorded on the blockchain yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => verifyBlockchainRecord()}
                disabled={isVerifying}
                className="border text-foreground hover:bg-muted"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isVerifying ? "Verifying..." : "Verify Again"}
              </Button>

              {(record?.transactionHash || verification?.transactionHash) && (
                <Button
                  variant="outline"
                  onClick={handleViewOnExplorer}
                  className="border text-foreground hover:bg-muted"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              )}

              <Button
                onClick={() => onOpenChange(false)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 border-0"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
