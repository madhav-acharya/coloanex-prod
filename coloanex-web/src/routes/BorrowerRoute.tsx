import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { canAccessBorrowerRoutes, getHomeRoute } from "@/lib/roleUtils";
import BorrowerDashboard from "@/pages/borrower/Dashboard";
import BrowseLenders from "@/pages/borrower/BrowseLenders";
import LenderDetails from "@/pages/borrower/LenderDetails";
import LoanDetails from "@/pages/borrower/LoanDetails";
import MakeRepayment from "@/pages/borrower/MakeRepayment";
import BorrowerPaymentSuccess from "@/pages/borrower/PaymentSuccess";
import BorrowerPaymentFailure from "@/pages/borrower/PaymentFailure";
import BorrowerKycStatus from "@/pages/borrower/BorrowerKycStatus";
import Settings from "@/pages/borrower/Settings";
import Features from "@/pages/public/Features";
import HowItWorks from "@/pages/public/HowItWorks";
import Security from "@/pages/public/Security";
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
            <Navigate to="/borrower/profile?section=my-loans" replace />
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
        path="/borrower/profile"
        element={
          <BorrowerRouteWrapper>
            <Settings />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/analytics"
        element={
          <BorrowerRouteWrapper>
            <Navigate to="/borrower/profile?section=my-loans" replace />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/how-it-works"
        element={
          <BorrowerRouteWrapper>
            <BorrowerLayout>
              <HowItWorks isSubcomponent />
            </BorrowerLayout>
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/features"
        element={
          <BorrowerRouteWrapper>
            <BorrowerLayout>
              <Features isSubcomponent />
            </BorrowerLayout>
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/security"
        element={
          <BorrowerRouteWrapper>
            <BorrowerLayout>
              <Security isSubcomponent />
            </BorrowerLayout>
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/pricing"
        element={
          <BorrowerRouteWrapper>
            <BorrowerLayout>
              <Pricing isSubcomponent />
            </BorrowerLayout>
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/wallet"
        element={
          <BorrowerRouteWrapper>
            <Navigate to="/borrower/profile?section=wallet" replace />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/payment-configs"
        element={
          <BorrowerRouteWrapper>
            <Navigate to="/borrower/profile?section=payment-config" replace />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/kyc/:id"
        element={
          <BorrowerRouteWrapper>
            <BorrowerKycStatus />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/payment/success"
        element={
          <BorrowerRouteWrapper>
            <BorrowerPaymentSuccess />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/borrower/payment/failure"
        element={
          <BorrowerRouteWrapper>
            <BorrowerPaymentFailure />
          </BorrowerRouteWrapper>
        }
      />
      <Route path="*" element={null} />
    </Routes>
  );
};
