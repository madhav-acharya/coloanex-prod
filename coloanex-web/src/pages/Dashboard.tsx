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
import { ArrowDownRight, ArrowUpRight, Calendar } from "lucide-react";
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
  trendPercentage?: number;
};

function StatCard({
  title,
  value,
  color,
  isCurrency = false,
  trend,
  trendPercentage,
}: StatCardProps) {
  const trendStart = trend?.[0]?.value ?? 0;
  const trendEnd = trend?.[trend.length - 1]?.value ?? 0;
  const calculatedPercentage =
    trendStart === 0
      ? trendEnd > 0
        ? 100
        : 0
      : Number((((trendEnd - trendStart) / trendStart) * 100).toFixed(2));
  const resolvedPercentage = trendPercentage ?? calculatedPercentage;
  const previousPoint =
    trend?.[Math.max((trend?.length || 1) - 2, 0)]?.value ?? 0;
  const movement = trendEnd - previousPoint;
  const isUp =
    resolvedPercentage > 0 || (resolvedPercentage === 0 && movement > 0);

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
          <div className="w-24">
            <div
              className={`mb-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isUp
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {isUp ? (
                <ArrowUpRight className="mr-1 h-3 w-3" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3" />
              )}
              {`${isUp ? "+" : "-"}${Math.abs(resolvedPercentage).toFixed(2)}%`}
            </div>
            <div className="w-full h-10">
              {trend && trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={trend}>
                    <Line isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out"
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
                    <Line isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out"
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

  const { data: tenantData } = useGetTenantAnalyticsQuery(
    isSuperAdmin
      ? undefined
      : {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
    {
      skip: isSuperAdmin,
    },
  );

  const months = Math.max(
    1,
    Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    ),
  );

  const rangeParams = {
    months,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };

  const { data: monthlyContracts } = useGetMonthlyContractsQuery(rangeParams);
  const { data: monthlyLoans } = useGetMonthlyLoansQuery(rangeParams);
  const { data: monthlyBorrowers } = useGetMonthlyBorrowersQuery(rangeParams, {
    skip: isSuperAdmin,
  });
  const { data: loansByStatus } = useGetLoansByStatusQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  const { data: contractsByStatus } = useGetContractsByStatusQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  const { data: monthlyRevenue } = useGetMonthlyRevenueQuery(rangeParams);
  const { data: monthlyUsers } = useGetMonthlyUsersQuery(rangeParams, {
    skip: !isSuperAdmin,
  });
  const { data: usersByRole } = useGetUsersByRoleQuery(
    {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    {
      skip: !isSuperAdmin,
    },
  );
  const { data: borrowerMonthlyLoans } = useGetBorrowerMonthlyLoansQuery(
    rangeParams,
    {
      skip: !isSuperAdmin,
    },
  );
  const { data: borrowersByStatus } = useGetBorrowersByStatusQuery(
    {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    {
      skip: !isSuperAdmin,
    },
  );

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
                value={adminData.totalUsers}
                color="#16A34A"
                trend={ensureTrendData(monthlyUsers)}
              />
              <StatCard
                title="Total Loans"
                value={adminData.totalLoans}
                color="#22C55E"
                trend={ensureTrendData(monthlyLoans)}
              />
              <StatCard
                title="Total Contracts"
                value={adminData.totalContracts}
                color="#059669"
                trend={ensureTrendData(monthlyContracts)}
              />
              <StatCard
                title="Total Transactions"
                value={adminData.totalTransactions}
                color="#F59E0B"
                trend={ensureTrendData(monthlyRevenue, 6)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Tenants"
                value={adminData.totalTenants}
                color="#16A34A"
                trend={ensureTrendData(monthlyUsers)}
              />
              <StatCard
                title="Active Tenants"
                value={adminData.activeTenants}
                color="#22C55E"
                trend={ensureTrendData(monthlyUsers)}
              />
              <StatCard
                title="Pending KYCs"
                value={adminData.pendingKYCs}
                color="#059669"
                trend={ensureTrendData(monthlyUsers)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Total Loan Amount"
                value={adminData.totalLoanAmount}
                color="#16A34A"
                isCurrency={true}
                trend={ensureTrendData(monthlyRevenue, 6)}
              />
              <StatCard
                title="Total Contract Amount"
                value={adminData.totalContractAmount}
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
                trend={
                  tenantData?.trendSeries?.newBorrowers ||
                  ensureTrendData(monthlyBorrowers)
                }
                trendPercentage={tenantData?.trendPercentages?.newBorrowers}
              />
              <StatCard
                title="Period Loans"
                value={getDateRangeValue(monthlyLoans)}
                color="#22C55E"
                trend={
                  tenantData?.trendSeries?.periodLoans ||
                  ensureTrendData(monthlyLoans)
                }
                trendPercentage={tenantData?.trendPercentages?.periodLoans}
              />
              <StatCard
                title="Active Loans"
                value={tenantData?.activeLoans ?? 0}
                color="#059669"
                trend={
                  tenantData?.trendSeries?.activeLoans ||
                  ensureTrendData(monthlyLoans)
                }
                trendPercentage={tenantData?.trendPercentages?.activeLoans}
              />
              <StatCard
                title="Period Contracts"
                value={getDateRangeValue(monthlyContracts)}
                color="#16A34A"
                trend={
                  tenantData?.trendSeries?.periodContracts ||
                  ensureTrendData(monthlyContracts)
                }
                trendPercentage={tenantData?.trendPercentages?.periodContracts}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Verified Borrowers"
                value={tenantData?.verifiedKYCs ?? 0}
                color="#16A34A"
                trend={
                  tenantData?.trendSeries?.verifiedBorrowers ||
                  ensureTrendData(monthlyBorrowers)
                }
                trendPercentage={
                  tenantData?.trendPercentages?.verifiedBorrowers
                }
              />
              <StatCard
                title="Pending KYCs"
                value={tenantData?.pendingKYCs ?? 0}
                color="#F59E0B"
                trend={
                  tenantData?.trendSeries?.pendingKYCs ||
                  ensureTrendData(monthlyBorrowers)
                }
                trendPercentage={tenantData?.trendPercentages?.pendingKYCs}
              />
              <StatCard
                title="Active Contracts"
                value={tenantData?.activeContracts ?? 0}
                color="#22C55E"
                trend={
                  tenantData?.trendSeries?.activeContracts ||
                  ensureTrendData(monthlyContracts)
                }
                trendPercentage={tenantData?.trendPercentages?.activeContracts}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Period Disbursed"
                value={tenantData?.totalDisbursed ?? 0}
                color="#16A34A"
                isCurrency={true}
                trend={
                  tenantData?.trendSeries?.periodDisbursed ||
                  ensureTrendData(monthlyRevenue, 6)
                }
                trendPercentage={tenantData?.trendPercentages?.periodDisbursed}
              />
              <StatCard
                title="Period Collected"
                value={tenantData?.totalCollected ?? 0}
                color="#22C55E"
                isCurrency={true}
                trend={
                  tenantData?.trendSeries?.periodCollected ||
                  ensureTrendData(monthlyRevenue, 6)
                }
                trendPercentage={tenantData?.trendPercentages?.periodCollected}
              />
              <StatCard
                title="Pending Payments"
                value={tenantData?.pendingPayments ?? 0}
                color="#F59E0B"
                isCurrency={true}
                trend={
                  tenantData?.trendSeries?.pendingPayments ||
                  ensureTrendData(monthlyRevenue, 6)
                }
                trendPercentage={tenantData?.trendPercentages?.pendingPayments}
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
                    <Line isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out"
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
                    <Line isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out"
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
                    <Line isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out"
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
                    <Line isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out"
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
                      <Line isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out"
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
