import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessSuperAdminRoutes, getHomeRoute } from "@/lib/roleUtils";
import Subscriptions from "@/pages/super-admin/Subscriptions";
import Roles from "@/pages/super-admin/Roles";
import Permissions from "@/pages/super-admin/Permissions";

interface SuperAdminRouteProps {
  children: React.ReactNode;
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

export const SuperAdminRouteWrapper = ({ children }: SuperAdminRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const hasToken = localStorage.getItem("token");

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || !user) {
    return <FullPageSkeleton />;
  }

  if (!canAccessSuperAdminRoutes(user)) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return <>{children}</>;
};

export const SuperAdminRoutes = () => {
  return (
    <Routes>
      <Route
        path="/system/subscriptions"
        element={
          <SuperAdminRouteWrapper>
            <Subscriptions />
          </SuperAdminRouteWrapper>
        }
      />
      <Route
        path="/system/roles"
        element={
          <SuperAdminRouteWrapper>
            <Roles />
          </SuperAdminRouteWrapper>
        }
      />
      <Route
        path="/system/permissions"
        element={
          <SuperAdminRouteWrapper>
            <Permissions />
          </SuperAdminRouteWrapper>
        }
      />
    </Routes>
  );
};
