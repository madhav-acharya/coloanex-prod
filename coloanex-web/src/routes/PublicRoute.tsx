import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BoneBlock } from "@/components/shared/Bone";
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
  if (isBorrower) return "/dashboard";
  return "/dashboard";
};

export const PublicRouteWrapper = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const hasToken = localStorage.getItem("token");

  if (isAuthenticated && hasToken && (isLoading || !user)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-3">
          <BoneBlock className="w-14 h-14 rounded-2xl mx-auto" />
          <BoneBlock className="h-4 w-2/3 rounded mx-auto" />
          <BoneBlock className="h-3 w-full rounded" />
          <BoneBlock className="h-3 w-5/6 rounded mx-auto" />
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
