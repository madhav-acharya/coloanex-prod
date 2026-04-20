import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import Signup from "@/pages/public/Signup";
import Features from "@/pages/public/Features";
import HowItWorks from "@/pages/public/HowItWorks";
import Security from "@/pages/public/Security";
import Pricing from "@/pages/public/Pricing";

interface PublicRouteProps {
  children: React.ReactNode;
}

const getHomeRoute = (user: any): string => {
  if (!user?.roles?.length) return "/dashboard";
  const isSuperAdmin = user.roles.some(
    (ur: any) => ur.role?.name === "Super Admin",
  );
  if (isSuperAdmin) return "/dashboard";
  const isAdminOrLender = user.roles.some(
    (ur: any) => ur.role?.name === "Admin" || ur.role?.name === "Lender",
  );
  if (isAdminOrLender) return "/dashboard";
  const isBorrower = user.roles.some((ur: any) => ur.role?.name === "Borrower");
  if (isBorrower) return "/borrower/dashboard";
  return "/dashboard";
};

export const PublicRouteWrapper = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const hasToken = localStorage.getItem("token");

  if (isAuthenticated && hasToken && (isLoading || !user)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="w-32 h-4 rounded" />
        </div>
      </div>
    );
  }

  const isAuthPage =
    window.location.pathname === "/login" ||
    window.location.pathname === "/signup";

  if (isAuthenticated && user && isAuthPage) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return <>{children}</>;
};

export const PublicRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRouteWrapper>
            <Landing />
          </PublicRouteWrapper>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRouteWrapper>
            <Login />
          </PublicRouteWrapper>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRouteWrapper>
            <Signup />
          </PublicRouteWrapper>
        }
      />
      <Route
        path="/pricing"
        element={
          <PublicRouteWrapper>
            <Pricing />
          </PublicRouteWrapper>
        }
      />
      <Route
        path="/features"
        element={
          <PublicRouteWrapper>
            <Features />
          </PublicRouteWrapper>
        }
      />
      <Route
        path="/security"
        element={
          <PublicRouteWrapper>
            <Security />
          </PublicRouteWrapper>
        }
      />
      <Route
        path="/how-it-works"
        element={
          <PublicRouteWrapper>
            <HowItWorks />
          </PublicRouteWrapper>
        }
      />
      <Route path="*" element={null} />
    </Routes>
  );
};
