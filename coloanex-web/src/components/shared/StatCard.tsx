import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/shared/GlassCard";

type StatCardProps = {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  className?: string;
  onClick?: () => void;
};

export function StatCard({
  title,
  value,
  icon,
  hint,
  className,
  onClick,
}: StatCardProps) {
  return (
    <GlassCard
      onClick={onClick}
      className={cn("p-5 sm:p-6 flex flex-col gap-3", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {icon ? (
          <div className="rounded-xl bg-primary/10 text-primary p-2">{icon}</div>
        ) : null}
      </div>
      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </GlassCard>
  );
}
