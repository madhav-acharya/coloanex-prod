import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PublicRoutes } from "@/routes/PublicRoute";
import { ProtectedRoutes } from "@/routes/ProtectedRoute";
import { SuperAdminRoutes } from "@/routes/SuperAdminRoute";
import { BorrowerRoutes } from "@/routes/BorrowerRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityLog } from "@/hooks/useActivityLog";

function App() {
  useActivityLog();

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Suspense fallback={<Loader />}>
        <SuperAdminRoutes />
        <BorrowerRoutes />
        <PublicRoutes />
        <ProtectedRoutes />
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
