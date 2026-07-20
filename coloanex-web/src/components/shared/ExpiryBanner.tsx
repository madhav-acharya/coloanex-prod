import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExpiryBannerProps = {
  status?: "EXPIRED" | "LIMIT_EXCEEDED" | "BOUGHT" | null;
  endsAt?: string | null;
  onAction?: () => void;
  className?: string;
};

export function ExpiryBanner({
  status,
  endsAt,
  onAction,
  className,
}: ExpiryBannerProps) {
  if (!status || status === "BOUGHT") return null;

  const message =
    status === "EXPIRED"
      ? `Your subscription${endsAt ? ` ended on ${new Date(endsAt).toLocaleDateString()}` : " has expired"}. Renew to continue platform-sponsored blockchain actions.`
      : "Your subscription transaction limit has been reached. Upgrade or wait for the usage window to reset.";

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-500/30 bg-amber-500/10 text-foreground p-4 flex flex-col sm:flex-row sm:items-center gap-3",
        className,
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
      {onAction ? (
        <Button
          size="sm"
          className="rounded-xl shrink-0"
          onClick={onAction}
        >
          Manage Plan
        </Button>
      ) : null}
    </div>
  );
}
