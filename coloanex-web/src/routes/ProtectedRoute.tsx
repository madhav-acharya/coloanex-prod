import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import { PermissionRequired } from "@/components/shared/PermissionRequired";
import { AccessRestricted } from "@/components/shared/AccessRestricted";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Tenants from "@/pages/Tenants";
import KycRequests from "@/pages/KycRequests";
import LoanRequests from "@/pages/LoanRequests";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Rules from "@/pages/Rules";
import Contracts from "@/pages/Contracts";
import Transactions from "@/pages/Transactions";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentFailure from "@/pages/PaymentFailure";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRouteWrapper = ({
  children,
  requiredPermission,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const hasToken = localStorage.getItem("token");
  const [showRestricted, setShowRestricted] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAuthenticated || hasToken) {
      timer = setTimeout(() => {
        setShowRestricted(true);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isAuthenticated, hasToken]);

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = user?.roles?.some(
    (ur: any) => ur.role?.name === "Super Admin",
  );

  const isAdminOrLender = user?.roles?.some(
    (ur: any) => ur.role?.name === "Admin" || ur.role?.name === "Lender",
  );
  
  const needsTenantId = !isSuperAdmin && isAdminOrLender && !user?.tenantId;
  const hasRequiredPermission = !requiredPermission || hasPermission(user, requiredPermission);

  if (!needsTenantId && hasRequiredPermission) {
    return <>{children}</>;
  }

  if (showRestricted && !isLoading) {
    if (needsTenantId && !["/profile", "/settings"].includes(window.location.pathname)) {
      return <AccessRestricted />;
    }

    if (requiredPermission && !hasRequiredPermission) {
      return <PermissionRequired requiredPermission={requiredPermission} />;
    }
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
    </Routes>
  );
};
