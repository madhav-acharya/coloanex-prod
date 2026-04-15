import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Subscriptions from "@/pages/Subscriptions";
import Roles from "@/pages/Roles";
import Permissions from "@/pages/Permissions";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export const SuperAdminRouteWrapper = ({ children }: SuperAdminRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const hasToken = localStorage.getItem("token");

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = user?.roles?.some(
    (ur: any) => ur.role?.name === "Super Admin",
  );

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const SuperAdminRoutes = () => {
  return (
    <Routes>
      <Route
        path="/subscriptions"
        element={
          <SuperAdminRouteWrapper>
            <Subscriptions />
          </SuperAdminRouteWrapper>
        }
      />
      <Route
        path="/roles"
        element={
          <SuperAdminRouteWrapper>
            <Roles />
          </SuperAdminRouteWrapper>
        }
      />
      <Route
        path="/permissions"
        element={
          <SuperAdminRouteWrapper>
            <Permissions />
          </SuperAdminRouteWrapper>
        }
      />
    </Routes>
  );
};
