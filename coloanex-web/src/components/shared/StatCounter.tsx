import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

type StatCounterProps = {
  value: number;
  suffix?: string;
  label: string;
  format?: "plain" | "compact";
  className?: string;
};

export function StatCounter({
  value,
  suffix = "",
  label,
  format = "plain",
  className,
}: StatCounterProps) {
  const { ref, value: n } = useCountUp(value, { duration: 1700 });

  const display =
    format === "compact" && n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
      : n.toLocaleString("en-US");

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "rounded-2xl border border-border/50 bg-card/70 p-4 sm:p-5 md:p-7",
        className,
      )}
    >
      <p className="text-xl sm:text-2xl md:text-4xl font-extrabold text-primary font-[family-name:var(--font-headline)] leading-snug">
        {display}
        {suffix}
      </p>
      <p className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground mt-2 leading-normal">
        {label}
      </p>
    </div>
  );
}
