import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessBorrowerRoutes, getHomeRoute } from "@/lib/roleUtils";
import BorrowerDashboard from "@/pages/borrower/BorrowerDashboard";
import BrowseLenders from "@/pages/borrower/BrowseLenders";
import LenderDetails from "@/pages/borrower/LenderDetails";
import MyLoans from "@/pages/borrower/MyLoans";
import LoanDetails from "@/pages/borrower/LoanDetails";
import MakeRepayment from "@/pages/borrower/MakeRepayment";
import BorrowerSettings from "@/pages/borrower/BorrowerSettings";
import Pricing from "@/pages/public/Pricing";

interface BorrowerRouteProps {
  children: React.ReactNode;
}

const FullPageSkeleton = () => (
  <div className="flex h-screen overflow-hidden bg-background">
    <aside className="w-64 shrink-0 border-r bg-background p-4 space-y-4">
      <Skeleton className="h-10 w-3/4 rounded-lg" />
      <div className="space-y-2 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    </aside>
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="p-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    </main>
  </div>
);

export const BorrowerRouteWrapper = ({ children }: BorrowerRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const hasToken = localStorage.getItem("token");

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || !user) {
    return <FullPageSkeleton />;
  }

  if (!canAccessBorrowerRoutes(user)) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return <>{children}</>;
};

export const BorrowerRoutes = () => {
  return (
    <Routes>
      <Route
        path="/borrower/dashboard"
        element={
          <BorrowerRouteWrapper>
            <BorrowerDashboard />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/lenders"
        element={
          <BorrowerRouteWrapper>
            <BrowseLenders />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/lenders/:id"
        element={
          <BorrowerRouteWrapper>
            <LenderDetails />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/my-loans"
        element={
          <BorrowerRouteWrapper>
            <MyLoans />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/my-loans/:id"
        element={
          <BorrowerRouteWrapper>
            <LoanDetails />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/repayment/:id"
        element={
          <BorrowerRouteWrapper>
            <MakeRepayment />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/settings"
        element={
          <BorrowerRouteWrapper>
            <BorrowerSettings />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/pricing"
        element={
          <BorrowerRouteWrapper>
            <Pricing />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/payment/success"
        element={
          <BorrowerRouteWrapper>
            <></>
          </BorrowerRouteWrapper>
        }
      />
    </Routes>
  );
};
