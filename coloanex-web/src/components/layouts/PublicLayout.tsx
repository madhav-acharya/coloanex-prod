import React from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { BottomNavbar } from "@/components/shared/BottomNavbar";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface PublicLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function PublicLayout({
  children,
  showHeader = true,
  showFooter = true,
}: PublicLayoutProps) {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 overflow-x-hidden">
      {showHeader && <Header variant="public" />}

      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 pt-16 pb-20 md:pb-0">{children}</main>

        {showFooter && <Footer />}

        <BottomNavbar
          variant="public"
          accountPath={user ? "/dashboard" : "/login"}
        />
      </div>
    </div>
  );
}
