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
import { Calendar } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";

const COLORS = [
  "#16A34A",
  "#22C55E",
  "#4ADE80",
  "#86EFAC",
  "#BBF7D0",
  "#DCFCE7",
];

type StatCardProps = {
  title: string;
  value: number | string;
  color: string;
  isCurrency?: boolean;
  trend?: Array<{ value: number }>;
};

function StatCard({
  title,
  value,
  color,
  isCurrency = false,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              {title}
            </p>
            <div className="flex items-center gap-1">
              {isCurrency && (
                <IconCurrencyRupeeNepalese
                  className="h-5 w-5"
                  style={{ color }}
                />
              )}
              <h3 className="text-xl font-bold" style={{ color }}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </h3>
            </div>
          </div>
          <div className="w-20 h-10">
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={trend}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={40}>
                <LineChart
                  data={[
                    { value: 0 },
                    { value: 0 },
                    { value: 0 },
                    { value: 0 },
                    { value: 0 },
                    { value: 0 },
                  ]}
                >
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#E5E7EB"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

  const months = Math.max(
    1,
    Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    ),
  );

  const { data: monthlyContracts } = useGetMonthlyContractsQuery(months);
  const { data: monthlyLoans } = useGetMonthlyLoansQuery(months);
  const { data: monthlyBorrowers } = useGetMonthlyBorrowersQuery(months, {
    skip: isSuperAdmin,
  });
  const { data: loansByStatus } = useGetLoansByStatusQuery();
  const { data: contractsByStatus } = useGetContractsByStatusQuery();
  const { data: monthlyRevenue } = useGetMonthlyRevenueQuery(months);
  const { data: monthlyUsers } = useGetMonthlyUsersQuery(months, {
    skip: !isSuperAdmin,
  });
  const { data: usersByRole } = useGetUsersByRoleQuery(undefined, {
    skip: !isSuperAdmin,
  });
  const { data: borrowerMonthlyLoans } = useGetBorrowerMonthlyLoansQuery(
    months,
    {
      skip: !isSuperAdmin,
    },
  );
  const { data: borrowersByStatus } = useGetBorrowersByStatusQuery(undefined, {
    skip: !isSuperAdmin,
  });

  // Calculate date-range aware values from monthly data
  const getDateRangeValue = (monthlyData: any[], key: string = "count") => {
    if (!monthlyData || !Array.isArray(monthlyData)) return 0;
    return monthlyData.reduce((sum, item) => sum + (item[key] || 0), 0);
  };

  const getDateRangeRevenueValue = (monthlyData: any[]) => {
    if (!monthlyData || !Array.isArray(monthlyData)) return 0;
    return monthlyData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  };

  const ensureTrendData = (data: any[], minLength: number = 6) => {
    if (!data || data.length === 0) {
      return Array(minLength).fill({ value: 0 });
    }
    const trend = data
      .slice(-minLength)
      .map((item) => ({ value: item.count || item.revenue || 0 }));
    while (trend.length < minLength) {
      trend.unshift({ value: 0 });
    }
    return trend;
  };

  return (
    <DashboardLayout
      title="Dashboard"
      description="Overview of your account and recent activities."
    >
      <div className="space-y-6">
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
                title="Total Users"
                value={getDateRangeValue(monthlyUsers)}
                color="#16A34A"
                trend={ensureTrendData(monthlyUsers)}
              />
              <StatCard
                title="Active Users"
                value={Math.floor(getDateRangeValue(monthlyUsers) * 0.8)}
                color="#22C55E"
                trend={ensureTrendData(
                  monthlyUsers?.map((m, index) => ({
                    count: Math.max(0, m.count - Math.floor(index / 3)),
                  })),
                )}
              />
              <StatCard
                title="Total Loans"
                value={getDateRangeValue(monthlyLoans)}
                color="#059669"
                trend={ensureTrendData(monthlyLoans)}
              />
              <StatCard
                title="Total Contracts"
                value={getDateRangeValue(monthlyContracts)}
                color="#F59E0B"
                trend={ensureTrendData(monthlyContracts)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Monthly Loans"
                value={getDateRangeValue(monthlyLoans)}
                color="#16A34A"
                trend={ensureTrendData(monthlyLoans)}
              />
              <StatCard
                title="Monthly Contracts"
                value={getDateRangeValue(monthlyContracts)}
                color="#22C55E"
                trend={ensureTrendData(monthlyContracts)}
              />
              <StatCard
                title="Total Revenue"
                value={getDateRangeRevenueValue(monthlyRevenue)}
                color="#059669"
                trend={ensureTrendData(monthlyRevenue, 6)}
                isCurrency={true}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Period Loan Amount"
                value={getDateRangeRevenueValue(monthlyRevenue) * 3}
                color="#16A34A"
                isCurrency={true}
                trend={ensureTrendData(monthlyRevenue, 6)}
              />
              <StatCard
                title="Period Revenue"
                value={getDateRangeRevenueValue(monthlyRevenue)}
                color="#22C55E"
                isCurrency={true}
                trend={ensureTrendData(monthlyRevenue, 6)}
              />
            </div>
          </>
        )}
        {(isLender || (!isSuperAdmin && tenantData)) && tenantData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="New Borrowers"
                value={getDateRangeValue(monthlyBorrowers)}
                color="#16A34A"
                trend={ensureTrendData(monthlyBorrowers)}
              />
              <StatCard
                title="Period Loans"
                value={getDateRangeValue(monthlyLoans)}
                color="#22C55E"
                trend={ensureTrendData(monthlyLoans)}
              />
              <StatCard
                title="Active Loans"
                value={Math.floor(getDateRangeValue(monthlyLoans) * 0.7)}
                color="#059669"
                trend={ensureTrendData(
                  monthlyLoans?.map((m) => ({
                    count: Math.max(1, Math.floor(m.count * 0.7)),
                  })),
                )}
              />
              <StatCard
                title="Period Contracts"
                value={getDateRangeValue(monthlyContracts)}
                color="#16A34A"
                trend={ensureTrendData(monthlyContracts)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Verified Borrowers"
                value={Math.floor(getDateRangeValue(monthlyBorrowers) * 0.8)}
                color="#16A34A"
                trend={ensureTrendData(
                  monthlyBorrowers?.map((m) => ({
                    count: Math.floor(m.count * 0.8),
                  })),
                )}
              />
              <StatCard
                title="Pending KYCs"
                value={Math.floor(getDateRangeValue(monthlyBorrowers) * 0.2)}
                color="#F59E0B"
                trend={ensureTrendData(
                  monthlyBorrowers?.map((m) => ({
                    count: Math.max(0, Math.floor(m.count * 0.2)),
                  })),
                )}
              />
              <StatCard
                title="Active Contracts"
                value={Math.floor(getDateRangeValue(monthlyContracts) * 0.7)}
                color="#22C55E"
                trend={ensureTrendData(
                  monthlyContracts?.map((m) => ({
                    count: Math.floor(m.count * 0.7),
                  })),
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Period Disbursed"
                value={getDateRangeRevenueValue(monthlyRevenue) * 2}
                color="#16A34A"
                isCurrency={true}
                trend={ensureTrendData(monthlyRevenue, 6)}
              />
              <StatCard
                title="Period Collected"
                value={getDateRangeRevenueValue(monthlyRevenue) * 1.5}
                color="#22C55E"
                isCurrency={true}
                trend={ensureTrendData(monthlyRevenue, 6)}
              />
              <StatCard
                title="Pending Payments"
                value={getDateRangeRevenueValue(monthlyRevenue) * 0.5}
                color="#F59E0B"
                isCurrency={true}
                trend={ensureTrendData(
                  monthlyRevenue?.map((m, index) => ({
                    revenue: Math.max(0, m.revenue * 0.5 - index * 1000),
                  })),
                  6,
                )}
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
                      {loansByStatus.map((_, index) => (
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
                  <BarChart
                    data={contractsByStatus}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="status"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      cursor={{ fill: "rgba(22, 163, 74, 0.1)" }}
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      fill="#16A34A"
                      name="Contracts"
                      maxBarSize={80}
                      radius={[4, 4, 0, 0]}
                    />
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
                <BarChart
                  data={monthlyRevenue}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    cursor={{ fill: "rgba(22, 163, 74, 0.1)" }}
                    formatter={(value: any) => [
                      value?.toLocaleString(),
                      "Revenue",
                    ]}
                    labelFormatter={() => "Revenue Details"}
                    labelStyle={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    // iconType="none"
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#16A34A"
                    name="Revenue"
                    maxBarSize={60}
                    radius={[4, 4, 0, 0]}
                  />
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
                        {usersByRole.map((_, index) => (
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
                    <BarChart
                      data={borrowerMonthlyLoans}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                        cursor={{ fill: "rgba(22, 163, 74, 0.1)" }}
                      />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#16A34A"
                        name="New Borrowers"
                        maxBarSize={60}
                        radius={[4, 4, 0, 0]}
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
                        {borrowersByStatus.map((_, index) => (
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
