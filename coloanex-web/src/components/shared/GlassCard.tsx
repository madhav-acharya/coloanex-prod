import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export function GlassCard({
  children,
  className,
  onClick,
  ...props
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border/50 bg-card/80 text-card-foreground backdrop-blur-md shadow-none",
        onClick && "cursor-pointer transition-colors hover:bg-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
