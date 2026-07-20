import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";
import { cn } from "@/lib/utils";

type BoneProps = {
  name: string;
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  minHeight?: string | number;
};

function BoneFallback({
  className,
  minHeight,
}: {
  className?: string;
  minHeight?: string | number;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-border/40 bg-muted/40 overflow-hidden relative",
        className,
      )}
      style={{ minHeight: minHeight ?? 160 }}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted/20 via-muted/50 to-muted/20" />
      <div className="relative p-4 sm:p-6 space-y-3">
        <div className="h-4 w-1/3 rounded-md bg-muted-foreground/15" />
        <div className="h-3 w-full rounded-md bg-muted-foreground/10" />
        <div className="h-3 w-5/6 rounded-md bg-muted-foreground/10" />
        <div className="h-24 w-full rounded-xl bg-muted-foreground/10 mt-4" />
      </div>
    </div>
  );
}

export function Bone({
  name,
  loading,
  children,
  className,
  minHeight,
}: BoneProps) {
  return (
    <BoneyardSkeleton
      name={name}
      loading={loading}
      animate="shimmer"
      color="hsla(220, 14%, 88%, 1)"
      darkColor="hsla(222, 28%, 22%, 1)"
      transition={280}
      stagger={60}
      className={cn("w-full", className)}
      fallback={<BoneFallback className={className} minHeight={minHeight} />}
    >
      {children}
    </BoneyardSkeleton>
  );
}

export function BoneBlock({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent",
        "dark:before:via-white/10",
        className,
      )}
      {...props}
    />
  );
}
