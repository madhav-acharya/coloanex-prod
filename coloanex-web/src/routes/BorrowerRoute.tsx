import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessBorrowerRoutes, getHomeRoute } from "@/lib/roleUtils";
import BorrowerDashboard from "@/pages/borrower/Dashboard";
import BrowseLenders from "@/pages/borrower/BrowseLenders";
import LenderDetails from "@/pages/borrower/LenderDetails";
import MyLoans from "@/pages/borrower/MyLoans";
import LoanDetails from "@/pages/borrower/LoanDetails";
import ContractDetails from "@/pages/borrower/ContractDetails";
import MakeRepayment from "@/pages/borrower/MakeRepayment";
import BorrowerPaymentSuccess from "@/pages/borrower/PaymentSuccess";
import BorrowerPaymentFailure from "@/pages/borrower/PaymentFailure";
import BorrowerKycStatus from "@/pages/borrower/BorrowerKycStatus";
import KycOverview from "@/pages/borrower/KycOverview";
import Settings from "@/pages/borrower/Settings";
import BorrowerAnalytics from "@/pages/borrower/Analytics";
import BorrowerTransactions from "@/pages/borrower/Transactions";
import BorrowerContracts from "@/pages/borrower/Contracts";
import BorrowerRules from "@/pages/borrower/Rules";
import BorrowerActivityLogs from "@/pages/borrower/ActivityLogs";

interface BorrowerRouteProps {
  children: React.ReactNode;
}

const FullPageSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="space-y-4 w-full max-w-sm px-6">
      <Skeleton className="h-10 w-3/4 rounded-lg mx-auto" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
    </div>
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
        path="/dashboard"
        element={
          <BorrowerRouteWrapper>
            <BorrowerDashboard />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/lenders"
        element={
          <BorrowerRouteWrapper>
            <BrowseLenders />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/lenders/:id"
        element={
          <BorrowerRouteWrapper>
            <LenderDetails />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/my-loans"
        element={
          <BorrowerRouteWrapper>
            <MyLoans />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/my-loans/:id"
        element={
          <BorrowerRouteWrapper>
            <LoanDetails />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/contracts"
        element={
          <BorrowerRouteWrapper>
            <BorrowerContracts />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/contracts/:id"
        element={
          <BorrowerRouteWrapper>
            <ContractDetails />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/transactions"
        element={
          <BorrowerRouteWrapper>
            <BorrowerTransactions />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/rules"
        element={
          <BorrowerRouteWrapper>
            <BorrowerRules />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/activity-logs"
        element={
          <BorrowerRouteWrapper>
            <BorrowerActivityLogs />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/repayment/:id"
        element={
          <BorrowerRouteWrapper>
            <MakeRepayment />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/profile"
        element={
          <BorrowerRouteWrapper>
            <Settings />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/kyc"
        element={
          <BorrowerRouteWrapper>
            <KycOverview />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/kyc/:id"
        element={
          <BorrowerRouteWrapper>
            <BorrowerKycStatus />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/wallet"
        element={
          <BorrowerRouteWrapper>
            <Navigate to="/profile?section=wallet" replace />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/payment-configs"
        element={
          <BorrowerRouteWrapper>
            <Navigate to="/profile?section=payment-config" replace />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/analytics"
        element={
          <BorrowerRouteWrapper>
            <BorrowerAnalytics />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/payment/success"
        element={
          <BorrowerRouteWrapper>
            <BorrowerPaymentSuccess />
          </BorrowerRouteWrapper>
        }
      />
      <Route
        path="/payment/failure"
        element={
          <BorrowerRouteWrapper>
            <BorrowerPaymentFailure />
          </BorrowerRouteWrapper>
        }
      />
      <Route path="/borrower/*" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={null} />
    </Routes>
  );
};
