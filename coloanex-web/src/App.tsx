import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Features from "./pages/Features";
import UseCases from "./pages/UseCases";
import Security from "./pages/Security";
import { RootState, AppDispatch } from "./store";
import { updateUserActivity, logoutUser } from "./store/slices/authSlice";
import Dashboard from "./pages/Dashboard";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Logout Component
const Logout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(logoutUser());
    navigate("/", { replace: true });
  }, [dispatch, navigate]);

  return null;
};

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        dispatch(updateUserActivity());
      }, 60000);

      const handleBeforeUnload = () => {
        if (isAuthenticated) {
          navigator.sendBeacon("/api/users/mark-offline");
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && isAuthenticated) {
          dispatch(updateUserActivity());
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [isAuthenticated, dispatch]);

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
      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
