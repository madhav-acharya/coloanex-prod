import { lazy, Suspense } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { BottomNavbar } from "@/components/shared/BottomNavbar";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const PublicBackgroundScene = lazy(
  () => import("@/components/shared/PublicBackgroundScene"),
);

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
    <div className="min-h-screen bg-background relative selection:bg-primary/25 overflow-x-hidden">
      <Suspense fallback={null}>
        <PublicBackgroundScene className="opacity-70" />
      </Suspense>
      {showHeader && <Header variant="public" />}
      <div className="relative z-10 min-h-screen flex flex-col">
        <main
          className={
            showHeader
              ? "flex-1 pt-[56px] md:pt-[60px] pb-20 md:pb-0"
              : "flex-1 pb-20 md:pb-0"
          }
        >
          {children}
        </main>
        {showFooter && <Footer />}
        <BottomNavbar
          variant="public"
          accountPath={user ? "/dashboard" : "/login"}
        />
      </div>
    </div>
  );
}
