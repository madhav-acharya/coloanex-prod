import { useActivityLog } from "@/hooks/useActivityLog";
import { PublicRoutes } from "@/routes/PublicRoute";
import { ProtectedRoutes } from "@/routes/ProtectedRoute";
import { SuperAdminRoutes } from "@/routes/SuperAdminRoute";

function App() {
  useActivityLog();

  return (
    <>
      <PublicRoutes />
      <ProtectedRoutes />
      <SuperAdminRoutes />
    </>
  );
}

export default App;
