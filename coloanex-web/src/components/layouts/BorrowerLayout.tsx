import type { ReactNode } from "react";
import Header from "@/components/shared/Header";
import { BottomNavbar } from "@/components/shared/BottomNavbar";
import { cn } from "@/lib/utils";

interface BorrowerLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function BorrowerLayout({
  children,
  className,
}: BorrowerLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header variant="borrower" />

      <main className="bg-background">
        <div
          className={cn(
            "container mx-auto p-4 md:p-6 pt-[72px] md:pt-[76px] pb-24 lg:pb-8 max-w-7xl shadow-none",
            className,
          )}
        >
          {children}
        </div>
      </main>

      <BottomNavbar variant="borrower" accountPath="/profile" />
    </div>
  );
}
