import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { format, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import {
  useGetAdminAnalyticsQuery,
  useGetTenantAnalyticsQuery,
  useGetMonthlyContractsQuery,
  useGetMonthlyLoansQuery,
  useGetLoansByStatusQuery,
  useGetContractsByStatusQuery,
  useGetMonthlyRevenueQuery,
  useGetMonthlyUsersQuery,
  useGetUsersByRoleQuery,
  useGetMonthlyBorrowersQuery,
  useGetBorrowerMonthlyLoansQuery,
  useGetBorrowersByStatusQuery,
} from "@/apis/analyticsApi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Building2,
  FileText,
  IndianRupee,
  TrendingUp,
  UserCheck,
  Clock,
  CheckCircle,
  Calendar,
} from "lucide-react";

const COLORS = [
  "#16A34A",
  "#22C55E",
  "#4ADE80",
  "#86EFAC",
  "#BBF7D0",
  "#DCFCE7",
];

const Dashboard = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const isSuperAdmin = user?.roles?.some(
    (r: any) => r.role?.name === "Super Admin",
  );
  const isLender = user?.roles?.some((r: any) => r.role?.name === "Lender");

  const { data: adminData } = useGetAdminAnalyticsQuery(undefined, {
    skip: !isSuperAdmin,
  });

  const { data: tenantData } = useGetTenantAnalyticsQuery(undefined);

  const months = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
  );
  const { data: monthlyContracts } = useGetMonthlyContractsQuery(
    months > 0 ? months : 1,
  );
  const { data: monthlyLoans } = useGetMonthlyLoansQuery(
    months > 0 ? months : 1,
  );
  const { data: monthlyBorrowers } = useGetMonthlyBorrowersQuery(
    months > 0 ? months : 1,
    {
      skip: isSuperAdmin,
    },
  );
  const { data: loansByStatus } = useGetLoansByStatusQuery();
  const { data: contractsByStatus } = useGetContractsByStatusQuery();
  const { data: monthlyRevenue } = useGetMonthlyRevenueQuery(
    months > 0 ? months : 1,
  );
  const { data: monthlyUsers } = useGetMonthlyUsersQuery(
    months > 0 ? months : 1,
    {
      skip: !isSuperAdmin,
    },
  );
  const { data: usersByRole } = useGetUsersByRoleQuery(undefined, {
    skip: !isSuperAdmin,
  });
  const { data: borrowerMonthlyLoans } = useGetBorrowerMonthlyLoansQuery(
    months > 0 ? months : 1,
    {
      skip: !isSuperAdmin,
    },
  );
  const { data: borrowersByStatus } = useGetBorrowersByStatusQuery(undefined, {
    skip: !isSuperAdmin,
  });

  const analytics = isSuperAdmin ? adminData : tenantData;

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">
              {value?.toLocaleString() || 0}
            </h3>
          </div>
          <div
            className={`h-12 w-12 rounded-lg flex items-center justify-center`}
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout
      title="Dashboard"
      description="Overview of your account and recent activities."
    >
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user?.fullName || "User"}!
            </h2>
            <p className="text-white/90">
              Here's what's happening with your account today.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-foreground">
                Date Range:
              </label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>From date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>To date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
        {isSuperAdmin && adminData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Tenants"
                value={adminData.totalTenants}
                icon={Building2}
                color="#16A34A"
              />
              <StatCard
                title="Active Tenants"
                value={adminData.activeTenants}
                icon={CheckCircle}
                color="#22C55E"
              />
              <StatCard
                title="Total Users"
                value={adminData.totalUsers}
                icon={Users}
                color="#059669"
              />
              <StatCard
                title="Pending KYCs"
                value={adminData.pendingKYCs}
                icon={Clock}
                color="#F59E0B"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Loans"
                value={adminData.totalLoans}
                icon={FileText}
                color="#16A34A"
              />
              <StatCard
                title="Total Contracts"
                value={adminData.totalContracts}
                icon={FileText}
                color="#22C55E"
              />
              <StatCard
                title="Total Transactions"
                value={adminData.totalTransactions}
                icon={TrendingUp}
                color="#059669"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Total Loan Amount"
                value={`NPR ${adminData.totalLoanAmount.toLocaleString()}`}
                icon={IndianRupee}
                color="#16A34A"
              />
              <StatCard
                title="Total Contract Amount"
                value={`NPR ${adminData.totalContractAmount.toLocaleString()}`}
                icon={IndianRupee}
                color="#22C55E"
              />
            </div>
          </>
        )}
        {(isLender || (!isSuperAdmin && tenantData)) && tenantData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Borrowers"
                value={tenantData.totalBorrowers}
                icon={Users}
                color="#16A34A"
              />
              <StatCard
                title="Total Loans"
                value={tenantData.totalLoans}
                icon={FileText}
                color="#22C55E"
              />
              <StatCard
                title="Active Loans"
                value={tenantData.activeLoans}
                icon={TrendingUp}
                color="#059669"
              />
              <StatCard
                title="Total Contracts"
                value={tenantData.totalContracts}
                icon={FileText}
                color="#16A34A"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Verified KYCs"
                value={tenantData.verifiedKYCs}
                icon={UserCheck}
                color="#16A34A"
              />
              <StatCard
                title="Pending KYCs"
                value={tenantData.pendingKYCs}
                icon={Clock}
                color="#F59E0B"
              />
              <StatCard
                title="Active Contracts"
                value={tenantData.activeContracts}
                icon={CheckCircle}
                color="#22C55E"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Disbursed"
                value={`NPR ${tenantData.totalDisbursed.toLocaleString()}`}
                icon={IndianRupee}
                color="#16A34A"
              />
              <StatCard
                title="Total Collected"
                value={`NPR ${tenantData.totalCollected.toLocaleString()}`}
                icon={IndianRupee}
                color="#22C55E"
              />
              <StatCard
                title="Pending Payments"
                value={`NPR ${tenantData.pendingPayments.toLocaleString()}`}
                icon={IndianRupee}
                color="#F59E0B"
              />
            </div>
          </>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {monthlyLoans && monthlyLoans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Loans Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyLoans}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#16A34A"
                      strokeWidth={2}
                      name="Loans Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {monthlyContracts && monthlyContracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Contracts Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyContracts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#22C55E"
                      strokeWidth={2}
                      name="Contracts Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isSuperAdmin && monthlyUsers && monthlyUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Users Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyUsers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#059669"
                      strokeWidth={2}
                      name="Users Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {!isSuperAdmin && monthlyBorrowers && monthlyBorrowers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Borrowers Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyBorrowers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#059669"
                      strokeWidth={2}
                      name="Borrowers Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {loansByStatus && loansByStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Loans by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={loansByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {loansByStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {contractsByStatus && contractsByStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Contracts by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contractsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#16A34A" name="Contracts" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
        {monthlyRevenue && monthlyRevenue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#16A34A" name="Revenue (NPR)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {monthlyUsers && monthlyUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#16A34A"
                        strokeWidth={2}
                        name="New Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {usersByRole && usersByRole.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Users by Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={usersByRole}
                        dataKey="count"
                        nameKey="role"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {usersByRole.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {borrowerMonthlyLoans && borrowerMonthlyLoans.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Borrower Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={borrowerMonthlyLoans}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#16A34A"
                        name="New Borrowers"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {borrowersByStatus && borrowersByStatus.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Borrowers by KYC Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={borrowersByStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {borrowersByStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}{" "}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
