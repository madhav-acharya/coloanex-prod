import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

        {/* User Permissions Debug Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Your Access Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Roles:</p>
              <div className="flex flex-wrap gap-2">
                {user?.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge
                      key={role}
                      variant="default"
                      className="bg-green-600"
                    >
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No roles assigned
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Permissions:</p>
              <div className="flex flex-wrap gap-2">
                {user?.permissions && user.permissions.length > 0 ? (
                  user.permissions.map((permission, index) => (
                    <Badge
                      key={`${permission}-${index}`}
                      variant="outline"
                      className="text-xs"
                    >
                      {permission}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No permissions assigned
                  </span>
                )}
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {user?.permissions?.includes("Read Roles") ? (
                  <span className="text-green-600 font-medium">
                    ✓ You have access to view roles
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">
                    ✗ You don't have permission to view roles
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.permissions?.includes("Read Permissions") ? (
                  <span className="text-green-600 font-medium">
                    ✓ You have access to view permissions
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">
                    ✗ You don't have permission to view permissions
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2.4M</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                +18% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground">
                +2.5% from last month
              </p>
            </CardContent>
          </Card> */}
        {/* </div> */}

        {/* Recent Activity */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "KYC Verified",
                  user: "Sarah M.",
                  time: "2 minutes ago",
                  status: "success",
                },
                {
                  action: "Document Uploaded",
                  user: "James K.",
                  time: "5 minutes ago",
                  status: "info",
                },
                {
                  action: "Loan Approved",
                  user: "Priya R.",
                  time: "12 minutes ago",
                  status: "success",
                },
                {
                  action: "New User Registration",
                  user: "Michael Chen",
                  time: "25 minutes ago",
                  status: "info",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.status === "success"
                          ? "bg-green-500"
                          : "bg-green-300"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.user}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
