import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
};

export function PageShell({ children, className, narrow }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-3 min-[360px]:px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16",
        narrow ? "max-w-5xl" : "max-w-[1600px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
