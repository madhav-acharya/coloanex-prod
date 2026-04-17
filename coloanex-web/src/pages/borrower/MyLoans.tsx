import { useState, useMemo } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, FileText, Activity, Clock, XCircle, CheckCircle2, AlertCircle, Link as LinkIcon, Download, SlidersHorizontal, ArrowUpDown, ChevronDown, Plus, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, History } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { useGetLoansQuery } from "@/apis/loansApi";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { BlockchainStatusBadge } from "@/components/shared/BlockchainStatusBadge";
import type { Loan, LoanQuery } from "@/types/loan";
import { LoanStatus } from "@/types/loan";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { ApplyLoanModal } from "./ApplyLoan";
import { useGetBorrowerAnalyticsQuery } from "@/apis/analyticsApi";
import { useGetWalletSummaryQuery, useGetTransactionsByEntityQuery } from "@/apis/transactionsApi";
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
import { cn } from "@/lib/utils";

export default function MyLoans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showApply, setShowApply] = useState(false);

  const { data: analytics, isLoading: isAnalyticsLoading } = useGetBorrowerAnalyticsQuery();
  const { data: walletSummary, isLoading: isWalletSummaryLoading } = useGetWalletSummaryQuery();
  const { data: transactionsData, isLoading: isTransactionsLoading } = useGetTransactionsByEntityQuery(user?.id || "", { skip: !user?.id });

  const [filters, setFilters] = useState<LoanQuery>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: loansData, isLoading, isFetching } = useGetLoansQuery(filters);

  const loans = useMemo(() => loansData?.data || [], [loansData]);
  const total = loansData?.total || 0;

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusBadge = (status: LoanStatus) => {
    const statusConfig: Record<LoanStatus, { className: string; label: string }> = {
      [LoanStatus.DRAFT]: { className: "bg-gray-100 text-gray-700 border-gray-200", label: "Draft" },
      [LoanStatus.SUBMITTED]: { className: "bg-blue-100 text-blue-700 border-blue-200", label: "Submitted" },
      [LoanStatus.UNDER_REVIEW]: { className: "bg-amber-100 text-amber-700 border-amber-200", label: "Under Review" },
      [LoanStatus.APPROVED]: { className: "bg-green-100 text-green-700 border-green-200", label: "Approved" },
      [LoanStatus.REJECTED]: { className: "bg-red-100 text-red-700 border-red-200", label: "Rejected" },
      [LoanStatus.CONTRACT_GENERATED]: { className: "bg-purple-100 text-purple-700 border-purple-200", label: "Contract Generated" },
      [LoanStatus.CONTRACT_SIGNED]: { className: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Contract Signed" },
      [LoanStatus.LOAN_PROVIDED]: { className: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Loan Provided" },
      [LoanStatus.PARTIALLY_PAID]: { className: "bg-orange-100 text-orange-700 border-orange-200", label: "Partially Paid" },
      [LoanStatus.PAID]: { className: "bg-green-100 text-green-700 border-green-200", label: "Paid" },
    };
    const config = statusConfig[status] || statusConfig[LoanStatus.DRAFT];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const columns: Column<Loan>[] = [
    {
      key: "purpose",
      label: "Purpose",
      sortable: false,
      render: (loan) => loan.purpose ? loan.purpose : "N/A",
    },
    {
      key: "requestedAmount",
      label: "Requested Amount",
      sortable: true,
      render: (loan) => (
        <span className="flex items-center gap-1">
          <IconCurrencyRupeeNepalese className="inline h-4 w-4" />
          {Number(loan.requestedAmount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: "requestedTermMonths",
      label: "Term",
      sortable: true,
      render: (loan) => `${loan.requestedTermMonths} months`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (loan) => getStatusBadge(loan.status),
    },
    {
      key: "blockchainTxHash",
      label: "Blockchain",
      sortable: false,
      render: (c) => <BlockchainStatusBadge blockchainTxHash={(c as any).blockchainTxHash || (c as any).blockchain_tx_hash} />,
    },
    {
      key: "createdAt",
      label: "Applied On",
      sortable: true,
      render: (loan) => loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : "N/A",
    },
  ];

  return (
    <BorrowerLayout
      title="Credit Ledger"
      description="Real-time analytics and transaction history for your institutional credit lines."
    >
      <div className="space-y-16">
        {/* Action Bar */}
        <div className="flex justify-end animate-fade-in">
          <Button 
            size="lg"
            onClick={() => navigate("/borrower/lenders")}
            className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all"
          >
            Request Capital <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
          {/* Summary Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <Wallet className="w-6 h-6" />
                     </div>
                     <h3 className="font-black text-xl tracking-tight">Overview</h3>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Borrowed</p>
                        <p className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-1">
                           <IconCurrencyRupeeNepalese className="w-8 h-8 text-primary" />
                           {Number(analytics?.totalBorrowed || 0).toLocaleString()}
                        </p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Total Paid</p>
                           <p className="text-xl font-bold text-emerald-500 font-headline">+{Number(analytics?.totalPaid || 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 text-right">
                           <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Outstanding</p>
                           <p className="text-xl font-bold text-rose-500 font-headline">-{Number(analytics?.pendingAmount || 0).toLocaleString()}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </Card>

            <div className="grid grid-cols-2 gap-6">
               <Card className="bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 text-center group hover:bg-primary/5 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-3">
                     <Activity className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Loans</p>
                  <p className="text-2xl font-black text-foreground">{analytics?.activeLoans || 0}</p>
               </Card>
               <Card className="bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 text-center group hover:bg-primary/5 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
                     <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Overdue</p>
                  <p className="text-2xl font-black text-foreground">{analytics?.overduePayments || 0}</p>
               </Card>
            </div>
          </div>

          {/* Charts */}
          <Card className="lg:col-span-2 bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden flex flex-col">
            <CardHeader className="px-8 pt-8 pb-0 flex flex-row items-center justify-between">
               <div className="space-y-1">
                  <CardTitle className="text-xl font-black tracking-tight">Financial Health</CardTitle>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Repayment vs Disbursement Trend</p>
               </div>
               <TrendingUp className="w-6 h-6 text-primary opacity-50" />
            </CardHeader>
            <CardContent className="p-8 flex-1">
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={walletSummary?.toGiveSeries || []}>
                        <defs>
                           <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                           dataKey="month" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                           dy={10}
                        />
                        <YAxis 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                        />
                        <Tooltip 
                           contentStyle={{ 
                              backgroundColor: 'rgba(23, 23, 23, 0.8)', 
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '16px',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                           }}
                           itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                           labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        />
                        <Line 
                           type="monotone" 
                           dataKey="value" 
                           stroke="#16A34A" 
                           strokeWidth={4} 
                           dot={{ fill: '#16A34A', strokeWidth: 2, r: 4, stroke: 'white' }}
                           activeDot={{ r: 8, strokeWidth: 0 }}
                           name="Payments"
                        />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
               <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <Activity className="w-6 h-6 text-primary" /> Active Contracts
               </h2>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Management of your live financial obligations</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-up">
            {isLoading || isFetching ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />
              ))
            ) : loans.length === 0 ? (
              <div className="col-span-full py-24 bg-surface/30 rounded-[2.5rem] border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-center">
                 <Activity className="w-16 h-16 mb-6 text-primary opacity-20" />
                 <h3 className="text-xl font-bold">No applications yet</h3>
                 <p className="text-muted-foreground max-w-xs mx-auto mt-2">Start your journey by exploring our verified marketplace partners.</p>
                 <Button variant="link" onClick={() => navigate("/borrower/lenders")} className="mt-4 font-bold text-primary hover:text-primary-dark">
                   Browse Marketplace &rarr;
                 </Button>
              </div>
            ) : (
              loans.map((loan) => (
                <Card 
                  key={loan.id} 
                  className="group bg-surface/40 backdrop-blur-xl border border-border/40 hover:border-primary/40 hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col relative"
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-all duration-700" />
                   
                   <CardContent className="p-8 space-y-6 flex-1 flex flex-col relative z-10">
                      <div className="flex items-start justify-between">
                         <div className="space-y-1">
                            <h3 className="font-bold text-xl text-foreground line-clamp-1 group-hover:text-primary transition-colors">{loan.purpose || "Institutional Credit"}</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                               <Clock className="w-3.5 h-3.5 text-primary" />
                               {loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : "N/A"}
                            </p>
                         </div>
                         {getStatusBadge(loan.status)}
                      </div>

                      <div className="py-6 px-6 bg-surface-container-low/30 rounded-3xl border border-border/20 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Principal</p>
                            <div className="flex items-center gap-1.5 text-2xl font-black text-foreground tracking-tighter">
                               <IconCurrencyRupeeNepalese className="w-6 h-6 text-primary" />
                               {Number(loan.requestedAmount).toLocaleString()}
                            </div>
                         </div>
                         <div className="text-right space-y-1">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Duration</p>
                            <p className="font-black text-xl text-foreground tracking-tighter">{loan.requestedTermMonths} <span className="text-xs font-bold text-muted-foreground uppercase">Mo</span></p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-auto">
                         <div className="scale-90 origin-left opacity-90">
                          <BlockchainStatusBadge blockchainTxHash={(loan as any).blockchainTxHash || (loan as any).blockchain_tx_hash} />
                         </div>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest gap-2 hover:bg-primary/10 hover:text-primary transition-all group/btn" 
                            onClick={() => navigate(`/borrower/loans/${loan.id}`)}
                         >
                            Analyze <ChevronDown className="w-4 h-4 -rotate-90 group-hover/btn:translate-x-1 transition-transform" />
                         </Button>
                      </div>
                   </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <History className="w-6 h-6 text-primary" /> Recent Activity
                 </h2>
                 <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Complete history of financial settlements</p>
              </div>
           </div>

           <Card className="bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-border/10 bg-surface/20">
                             <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Type</th>
                             <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Amount</th>
                             <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                             <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Date</th>
                             <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Blockchain</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-border/10">
                          {isTransactionsLoading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                   <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                                   <td className="px-8 py-6"><Skeleton className="h-4 w-16" /></td>
                                   <td className="px-8 py-6"><Skeleton className="h-4 w-16" /></td>
                                   <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                                   <td className="px-8 py-6"><Skeleton className="h-4 w-32 ml-auto" /></td>
                                </tr>
                             ))
                          ) : transactionsData?.length === 0 ? (
                             <tr>
                                <td colSpan={5} className="px-8 py-16 text-center text-muted-foreground font-medium">
                                   No transaction records found.
                                </td>
                             </tr>
                          ) : (
                             transactionsData?.slice(0, 10).map((tx: any) => (
                                <tr key={tx.id} className="group hover:bg-primary/5 transition-all">
                                   <td className="px-8 py-6">
                                      <div className="flex items-center gap-3">
                                         <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs",
                                            tx.type === 'DISBURSEMENT' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                                         )}>
                                            {tx.type === 'DISBURSEMENT' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                         </div>
                                         <span className="font-bold text-sm tracking-tight">{tx.type.replace('_', ' ')}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6">
                                      <span className="font-black text-sm tracking-tighter flex items-center gap-1">
                                         <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                                         {Number(tx.amount).toLocaleString()}
                                      </span>
                                   </td>
                                   <td className="px-8 py-6">
                                      <Badge className={cn(
                                         "rounded-full text-[10px] font-black px-3 py-0.5",
                                         tx.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                      )}>
                                         {tx.status}
                                      </Badge>
                                   </td>
                                   <td className="px-8 py-6 text-sm text-muted-foreground font-medium">
                                      {format(new Date(tx.createdAt), "MMM dd, yyyy")}
                                   </td>
                                   <td className="px-8 py-6 text-right">
                                      <div className="flex justify-end scale-75 origin-right">
                                         <BlockchainStatusBadge blockchainTxHash={tx.blockchainTxHash} />
                                      </div>
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </BorrowerLayout>
  );
}
