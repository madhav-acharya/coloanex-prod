import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Features from "./pages/Features";
import UseCases from "./pages/UseCases";
import Security from "./pages/Security";
import { logout } from "./store/slices/authSlice";
import {
  useLogoutMutation,
  useLogVisitMutation,
  useLogLeaveMutation,
} from "./apis/authApi";
import Dashboard from "./pages/Dashboard";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import Users from "./pages/Users";
import Tenants from "./pages/Tenants";
import KycRequests from "./pages/KycRequests";
import LoanRequests from "./pages/LoanRequests";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Rules from "./pages/Rules";
import Contracts from "./pages/Contracts";
import Transactions from "./pages/Transactions";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import { hasPermission } from "./lib/permissions";
import { Lock } from "lucide-react";

const ProtectedRoute = ({
  children,
  requiredPermission,
}: {
  children: React.ReactNode;
  requiredPermission?: string;
}) => {
  const { isAuthenticated, user } = useAuth();
  const hasToken = localStorage.getItem("token");

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

  if (
    needsTenantId &&
    window.location.pathname !== "/profile" &&
    window.location.pathname !== "/settings"
  ) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Access Restricted
          </h2>
          <p className="text-muted-foreground mb-4">
            Your account needs to be assigned to a tenant before you can access
            this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact a Super Admin to assign a tenant to your account.
          </p>
        </div>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Permission Required
          </h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Required permission:{" "}
            <code className="bg-muted px-2 py-1 rounded">
              {requiredPermission}
            </code>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutMutation] = useLogoutMutation();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logoutMutation().unwrap();
      } catch (error) {
      } finally {
        dispatch(logout());
        navigate("/", { replace: true });
      }
    };
    handleLogout();
  }, [dispatch, navigate, logoutMutation]);

  return null;
};

function App() {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [logVisit] = useLogVisitMutation();
  const [logLeave] = useLogLeaveMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    logVisit();

    let leaveTimeout: NodeJS.Timeout;

    const handleBeforeUnload = () => {
      navigator.sendBeacon("/api/auth/leave", JSON.stringify({}));
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        leaveTimeout = setTimeout(() => {
          logLeave();
        }, 5000);
      } else {
        if (leaveTimeout) {
          clearTimeout(leaveTimeout);
        }
        logVisit();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
      }
    };
  }, [isAuthenticated, logVisit, logLeave]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route path="/features" element={<Features />} />
      <Route path="/use-cases" element={<UseCases />} />
      <Route path="/security" element={<Security />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute requiredPermission="Read Roles">
            <Roles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/permissions"
        element={
          <ProtectedRoute requiredPermission="Read Permissions">
            <Permissions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredPermission="Read Users">
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants"
        element={
          <ProtectedRoute requiredPermission="Read Tenants">
            <Tenants />
          </ProtectedRoute>
        }
      />

      <Route
        path="/kyc-requests"
        element={
          <ProtectedRoute requiredPermission="Read KYC Documents">
            <KycRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/loan-requests"
        element={
          <ProtectedRoute requiredPermission="Read Loans">
            <LoanRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rules"
        element={
          <ProtectedRoute requiredPermission="Read Loans">
            <Rules />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contracts"
        element={
          <ProtectedRoute requiredPermission="Read Loans">
            <Contracts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute requiredPermission="Read Payments">
            <Transactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/success"
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/failure"
        element={
          <ProtectedRoute>
            <PaymentFailure />
          </ProtectedRoute>
        }
      />

      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
