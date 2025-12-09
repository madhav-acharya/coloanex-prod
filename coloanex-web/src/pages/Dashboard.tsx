import { Card, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <DashboardLayout
      title="Dashboard"
      description="Overview of your account and recent activities."
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-gradient-hero text-white border-0">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user?.fullName || "User"}!
            </h2>
            <p className="text-white/80">
              Here's what's happening with your account today.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
