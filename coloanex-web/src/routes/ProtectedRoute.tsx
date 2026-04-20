import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import { canAccessAdminRoutes, getRoles } from "@/lib/roleUtils";
import { PermissionRequired } from "@/components/shared/PermissionRequired";
import { AccessRestricted } from "@/components/shared/AccessRestricted";
import { Skeleton } from "@/components/ui/skeleton";
import Dashboard from "@/pages/admin/Dashboard";
import Users from "@/pages/admin/Users";
import Tenants from "@/pages/admin/Tenants";
import KycRequests from "@/pages/admin/KycRequests";
import LoanRequests from "@/pages/admin/LoanRequests";
import Profile from "@/pages/admin/Profile";
import Settings from "@/pages/admin/Settings";
import Rules from "@/pages/admin/Rules";
import Contracts from "@/pages/admin/Contracts";
import Transactions from "@/pages/admin/Transactions";
import PaymentSuccess from "@/pages/admin/PaymentSuccess";
import PaymentFailure from "@/pages/admin/PaymentFailure";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const FullPageSkeleton = () => (
  <div className="flex h-screen overflow-hidden bg-background">
    <aside className="w-64 shrink-0 border-r bg-background p-4 space-y-4">
      <Skeleton className="h-10 w-3/4 rounded-lg" />
      <div className="space-y-2 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
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

export const ProtectedRouteWrapper = ({
  children,
  requiredPermission,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const hasToken = localStorage.getItem("token");

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || !user) {
    return <FullPageSkeleton />;
  }

  if (!canAccessAdminRoutes(user)) {
    return <Navigate to="/borrower/dashboard" replace />;
  }

  const { isSuperAdmin } = getRoles(user);
  const isAdminOrLender = user.roles?.some(
    (ur: any) => ur.role?.name === "Admin" || ur.role?.name === "Lender",
  );

  const needsTenantId = !isSuperAdmin && isAdminOrLender && !user.tenantId;
  const hasRequiredPermission =
    !requiredPermission || hasPermission(user, requiredPermission);

  if (
    needsTenantId &&
    !["/profile", "/settings"].includes(window.location.pathname)
  ) {
    return <AccessRestricted />;
  }

  if (requiredPermission && !hasRequiredPermission) {
    return <PermissionRequired requiredPermission={requiredPermission} />;
  }

  return <>{children}</>;
};

export const ProtectedRoutes = () => {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <ProtectedRouteWrapper>
            <Dashboard />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRouteWrapper requiredPermission="Read Users">
            <Users />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/tenants"
        element={
          <ProtectedRouteWrapper requiredPermission="Read Tenants">
            <Tenants />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/kyc-requests"
        element={
          <ProtectedRouteWrapper requiredPermission="Read KYC Documents">
            <KycRequests />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/loan-requests"
        element={
          <ProtectedRouteWrapper requiredPermission="Read Loans">
            <LoanRequests />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/rules"
        element={
          <ProtectedRouteWrapper requiredPermission="Read Loans">
            <Rules />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/contracts"
        element={
          <ProtectedRouteWrapper requiredPermission="Read Loans">
            <Contracts />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRouteWrapper requiredPermission="Read Payments">
            <Transactions />
          </ProtectedRouteWrapper>
        }
      />
      <Route path="/transactions" element={<Navigate to="/wallet" replace />} />
      <Route
        path="/profile"
        element={
          <ProtectedRouteWrapper>
            <Profile />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRouteWrapper>
            <Settings />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/payment/success"
        element={
          <ProtectedRouteWrapper>
            <PaymentSuccess />
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/payment/failure"
        element={
          <ProtectedRouteWrapper>
            <PaymentFailure />
          </ProtectedRouteWrapper>
        }
      />
      <Route path="*" element={null} />
    </Routes>
  );
};
