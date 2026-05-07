import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { PublicRoutes } from "@/routes/PublicRoute";
import { ProtectedRoutes } from "@/routes/ProtectedRoute";
import { SuperAdminRoutes } from "@/routes/SuperAdminRoute";
import { BorrowerRoutes } from "@/routes/BorrowerRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

import { getRoles } from "@/lib/roleUtils";
import { useAuth } from "@/hooks/useAuth";

function App() {
  const { user } = useAuth();
  const roles = getRoles(user);
  useActivityLog();
  useTheme();

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        {roles.isSuperAdmin && <SuperAdminRoutes />}
        {roles.isBorrower && <BorrowerRoutes />}
        {roles.isSuperAdmin || roles.isAdmin || roles.isLender ? (
          <ProtectedRoutes />
        ) : null}
        <PublicRoutes />
      </Suspense>
    </div>
  );
}

const Loader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.15)] overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
  </div>
);

export default App;
