import { useMemo, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetContractQuery,
  useSignContractMutation,
} from "@/apis/contractsApi";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  Download,
  User,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  Building2,
  Lock,
  PenLine,
} from "lucide-react";
import { BlockchainStatusBadge } from "@/components/shared/BlockchainStatusBadge";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const revealRef = useRevealOnMount([]);
  const { data: contract, isLoading, refetch } = useGetContractQuery(id || "", {
    skip: !id,
  });
  const [signContract, { isLoading: isSigning }] = useSignContractMutation();
  const [signOpen, setSignOpen] = useState(false);
  const [signature, setSignature] = useState("");

  const money = (value?: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const hasBorrowerSigned = useMemo(
    () =>
      contract?.signatures?.some((sig) => sig.signedBy === "BORROWER") ?? false,
    [contract?.signatures],
  );

  const canSign =
    !!contract &&
    !hasBorrowerSigned &&
    ["DRAFT", "PENDING_SIGNATURE", "GENERATED", "PENDING"].includes(
      String(contract.status || "").toUpperCase(),
    );

  const handleSign = async () => {
    if (!id) return;
    const sig =
      signature.trim() || user?.fullName?.trim() || user?.email?.trim() || "";
    if (!sig) {
      toast.error("Enter your full name as signature");
      return;
    }
    try {
      await signContract({ id, data: { signature: sig } }).unwrap();
      toast.success("Contract signed successfully");
      setSignOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to sign contract");
    }
  };

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="hero"
            density={32}
            className="opacity-40 h-[260px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Legal Instrument"
              description={
                contract
                  ? `Agreement ${contract.contractNumber}`
                  : "Contract details and signatures"
              }
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="rounded-2xl h-11 text-muted-foreground"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  {contract?.contractPdfUrl && (
                    <Button
                      onClick={() =>
                        window.open(contract.contractPdfUrl, "_blank")
                      }
                      className="rounded-2xl h-11 px-6 font-semibold"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                  )}
                  {canSign && (
                    <Button
                      onClick={() => {
                        setSignature(user?.fullName || "");
                        setSignOpen(true);
                      }}
                      className="rounded-2xl h-11 px-6 font-semibold"
                    >
                      <PenLine className="w-4 h-4 mr-2" /> Sign Contract
                    </Button>
                  )}
                </div>
              }
            />
          </ParallaxLayer>

          <Bone
            name="borrower-contract-details"
            loading={isLoading}
            minHeight={420}
          >
            {!contract ? (
              <GlassCard className="p-10 flex flex-col items-center text-center gap-4">
                <FileText className="w-10 h-10 text-muted-foreground/40" />
                <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
                  Contract Not Found
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  This agreement is restricted or was not found in the system
                  records.
                </p>
                <Button
                  onClick={() => navigate("/my-loans")}
                  className="rounded-2xl px-8 h-11 font-semibold mt-2"
                >
                  Back to Portfolio
                </Button>
              </GlassCard>
            ) : (
              <div
                ref={revealRef as React.RefObject<HTMLDivElement>}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
              >
                <div className="lg:col-span-8 space-y-6" data-reveal>
                  <GlassCard className="p-5 sm:p-8">
                    <div className="flex items-center justify-between gap-6 pb-6 border-b border-border/40">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-headline)]">
                            Terms & Conditions
                          </h2>
                          <p className="text-[11px] font-bold text-muted-foreground tracking-wider">
                            Digitally Governed Agreement
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          contract.status === "ACTIVE" ? "default" : "secondary"
                        }
                        className="rounded-lg h-7 px-3 text-[11px] font-bold tracking-wider"
                      >
                        {contract.status}
                      </Badge>
                    </div>
                    <div className="pt-6">
                      <div className="p-5 sm:p-8 rounded-2xl bg-muted/30 border border-border/40">
                        <p className="text-sm leading-relaxed text-foreground/90 font-medium whitespace-pre-wrap">
                          {contract.termsAndConditions ||
                            "This document outlines the financial obligations and legal covenants between the borrower and the funding institution. Settlements are processed through smart contracts for immutable record-keeping."}
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 sm:p-8 border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                      <h3 className="text-sm font-bold tracking-wider text-primary flex items-center gap-2 font-[family-name:var(--font-headline)]">
                        <ShieldCheck className="w-5 h-5" />
                        Ledger Anchoring
                      </h3>
                      <BlockchainStatusBadge
                        blockchainTxHash={contract.blockchainTxHash}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-muted-foreground tracking-wider flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5" /> Immutable Fingerprint
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                          This instrument is permanently registered on-chain.
                          Post-settlement modification is cryptographically
                          impossible.
                        </p>
                      </div>
                      <div className="p-5 rounded-2xl bg-card/80 border border-border/50 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[11px] font-bold tracking-wider">
                            Proven Integrity
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-muted-foreground tracking-wider">
                          Digital SHA-256 Verified
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <div className="lg:col-span-4 space-y-5" data-reveal>
                  <GlassCard className="overflow-hidden">
                    <div className="p-5 border-b border-border/40">
                      <h3 className="text-xs font-bold tracking-wider text-muted-foreground">
                        Financial Summary
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-4">
                      <SummaryItem
                        label="Principal"
                        value={money(contract.loanAmount)}
                      />
                      <SummaryItem
                        label="Interest Rate"
                        value={`${contract.interestRate}% APR`}
                      />
                      <SummaryItem
                        label="Repayment Term"
                        value={`${contract.termMonths} Months`}
                      />
                      <div className="pt-5 mt-2 border-t border-border/40">
                        <p className="text-[11px] font-bold tracking-wider text-primary mb-1.5">
                          Total Dues
                        </p>
                        <p className="text-2xl font-bold text-primary tracking-tight font-[family-name:var(--font-headline)]">
                          {money(contract.totalAmountDue)}
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="overflow-hidden">
                    <div className="p-5 border-b border-border/40">
                      <h3 className="text-xs font-bold tracking-wider text-muted-foreground">
                        Validation Log
                      </h3>
                    </div>
                    <div className="p-5 space-y-3">
                      {contract.signatures?.length ? (
                        contract.signatures.map((sig, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 rounded-2xl border border-border/40 hover:bg-muted/20 transition-colors"
                          >
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border/40",
                                sig.signedBy === "BORROWER"
                                  ? "text-primary bg-primary/10"
                                  : "text-foreground bg-muted",
                              )}
                            >
                              {sig.signedBy === "BORROWER" ? (
                                <User className="w-5 h-5" />
                              ) : (
                                <Building2 className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground tracking-tight">
                                {sig.signedBy}
                              </p>
                              <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                                Authenticated{" "}
                                {new Date(sig.signedAt).toLocaleDateString()}
                              </p>
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-primary font-bold tracking-wider">
                                <CheckCircle2 className="w-3 h-3" /> Validated
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No signatures recorded yet.
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}
          </Bone>
        </PageShell>
      </div>

      <Dialog open={signOpen} onOpenChange={setSignOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-headline)]">
              Sign Contract
            </DialogTitle>
            <DialogDescription>
              Your typed name constitutes your electronic signature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Full legal name"
              className="h-11 rounded-2xl"
            />
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
              <p className="text-[11px] font-bold text-muted-foreground tracking-wider mb-1">
                Signature Preview
              </p>
              <p className="text-lg font-semibold text-foreground italic">
                {signature || user?.fullName || "—"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => setSignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-2xl"
              onClick={handleSign}
              disabled={isSigning}
            >
              {isSigning ? "Signing..." : "Confirm Signature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BorrowerLayout>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-0.5">
      <span className="text-xs font-bold text-muted-foreground tracking-wider">
        {label}
      </span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
