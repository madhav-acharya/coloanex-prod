import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Features from "@/pages/Features";
import UseCases from "@/pages/UseCases";
import HowItWorks from "@/pages/HowItWorks";
import Security from "@/pages/Security";
import Pricing from "@/pages/Pricing";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRouteWrapper = ({ children }: PublicRouteProps) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/use-cases" element={<UseCases />} />
      <Route path="/security" element={<Security />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
    </Routes>
  );
};
