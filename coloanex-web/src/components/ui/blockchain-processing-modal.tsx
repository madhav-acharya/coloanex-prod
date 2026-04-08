import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, Box, Check } from "lucide-react";

interface BlockchainProcessingModalProps {
  open: boolean;
  message?: string;
  currentStep?: "blockchain" | "database" | "complete" | "error";
  error?: string;
}

export function BlockchainProcessingModal({
  open,
  message = "Processing blockchain transaction...",
  currentStep = "blockchain",
  error,
}: BlockchainProcessingModalProps) {
  return (
    <DialogPrimitive.Root open={open} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[99998] bg-black/80 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="sm:max-w-md border-2 z-[99999] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-card text-card-foreground grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            {currentStep === "error"
              ? "Transaction Failed"
              : "Processing Transaction"}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {currentStep === "error"
              ? error || "An error occurred during blockchain processing"
              : message}
          </DialogPrimitive.Description>
          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 animate-pulse" />
              </div>
              <div className="relative flex items-center justify-center h-20 w-20">
                <Box
                  className="h-10 w-10 text-primary animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>

            <div className="space-y-4 text-center">
              <h3 className="text-xl font-semibold">
                {currentStep === "error"
                  ? "Transaction Failed"
                  : "Processing Transaction"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {currentStep === "error"
                  ? error || "An error occurred during blockchain processing"
                  : message}
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <div className="flex items-center space-x-3">
                {currentStep === "blockchain" ? (
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                ) : (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                <span
                  className={`text-sm ${
                    currentStep === "blockchain"
                      ? "text-green-600 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentStep === "blockchain"
                    ? "Recording on blockchain..."
                    : "Recorded on blockchain ✓"}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {currentStep === "database" ? (
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                ) : currentStep === "complete" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-gray-300" />
                )}
                <span
                  className={`text-sm ${
                    currentStep === "database"
                      ? "text-blue-600 font-medium"
                      : currentStep === "complete"
                        ? "text-muted-foreground"
                        : "text-gray-400"
                  }`}
                >
                  {currentStep === "database"
                    ? "Updating database..."
                    : currentStep === "complete"
                      ? "Database updated ✓"
                      : "Updating database"}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic pt-4">
              Please wait, this may take a few seconds...
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
