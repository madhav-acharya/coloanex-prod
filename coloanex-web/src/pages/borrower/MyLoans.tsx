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
      <div className="space-y-12">
        {/* Action Bar */}
        <div className="flex justify-end animate-fade-in no-spotlight">
          <Button 
            size="lg"
            onClick={() => navigate("/borrower/lenders")}
            className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 transition-all shadow-soft"
          >
            Request Capital <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
          {/* Summary Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-surface/20 backdrop-blur-md border border-border/10 rounded-[2.5rem] p-8 relative overflow-hidden group no-spotlight shadow-soft">
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">
                        <Wallet className="w-6 h-6" />
                     </div>
                     <h3 className="font-black text-lg uppercase tracking-widest">Cap Table</h3>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Portfolio Value</p>
                        <p className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-1">
                           <IconCurrencyRupeeNepalese className="w-8 h-8 text-primary" />
                           {Number(analytics?.totalBorrowed || 0).toLocaleString()}
                        </p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Settled</p>
                           <p className="text-xl font-black text-emerald-500 uppercase tracking-tight">+{Number(analytics?.totalPaid || 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 text-right">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Owed</p>
                           <p className="text-xl font-black text-rose-500 uppercase tracking-tight">-{Number(analytics?.pendingAmount || 0).toLocaleString()}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </Card>

            <div className="grid grid-cols-2 gap-6">
               <Card className="bg-surface/10 backdrop-blur-sm border border-border/10 rounded-[2rem] p-6 text-center group transition-colors no-spotlight">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/10">
                     <Activity className="w-5 h-5" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Active</p>
                  <p className="text-2xl font-black text-foreground tracking-tighter">{analytics?.activeLoans || 0}</p>
               </Card>
               <Card className="bg-surface/10 backdrop-blur-sm border border-border/10 rounded-[2rem] p-6 text-center group transition-colors no-spotlight">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/10">
                     <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Alerts</p>
                  <p className="text-2xl font-black text-foreground tracking-tighter">{analytics?.overduePayments || 0}</p>
               </Card>
            </div>
          </div>

          {/* Charts */}
          <Card className="lg:col-span-2 bg-surface/20 backdrop-blur-md border border-border/10 rounded-[2.5rem] overflow-hidden flex flex-col no-spotlight shadow-soft">
            <CardHeader className="px-8 pt-8 pb-0 flex flex-row items-center justify-between">
               <div className="space-y-1">
                  <CardTitle className="text-lg font-black tracking-widest uppercase">Velocity</CardTitle>
                  <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.2em]">Repayment Flow</p>
               </div>
               <TrendingUp className="w-5 h-5 text-primary opacity-30" />
            </CardHeader>
            <CardContent className="p-8 flex-1">
               <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={walletSummary?.toGiveSeries || []}>
                        <defs>
                           <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                        <XAxis 
                           dataKey="month" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 900 }}
                           dy={10}
                        />
                        <YAxis 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 900 }}
                        />
                        <Tooltip 
                           contentStyle={{ 
                              backgroundColor: 'rgba(23, 23, 23, 0.9)', 
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '20px',
                           }}
                           itemStyle={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase' }}
                           labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontWeight: 900, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em' }}
                        />
                        <Line 
                           type="monotone" 
                           dataKey="value" 
                           stroke="#22C55E" 
                           strokeWidth={3} 
                           dot={{ fill: '#22C55E', strokeWidth: 1.5, r: 3, stroke: 'white' }}
                           activeDot={{ r: 6, strokeWidth: 0 }}
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
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-foreground uppercase tracking-[0.2em]">Live Contracts</h2>
            <div className="h-px flex-1 mx-6 bg-border/20 hidden sm:block" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
            {isLoading || isFetching ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />
              ))
            ) : loans.length === 0 ? (
              <div className="col-span-full py-24 bg-surface/10 rounded-[2.5rem] border border-dashed border-border/10 flex flex-col items-center justify-center text-center no-spotlight">
                 <Activity className="w-12 h-12 mb-6 text-primary opacity-10" />
                 <h3 className="text-base font-black uppercase tracking-widest">No active deployments</h3>
                 <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto mt-3 font-medium">Initialize your first credit facility through the marketplace.</p>
                 <Button variant="link" onClick={() => navigate("/borrower/lenders")} className="mt-6 font-black text-primary hover:opacity-80 uppercase tracking-widest text-[10px]">
                   Open Marketplace &rarr;
                 </Button>
              </div>
            ) : (
              loans.map((loan) => (
                <Card 
                  key={loan.id} 
                  className="group bg-surface/20 backdrop-blur-md border border-border/10 hover:border-primary/20 transition-all duration-700 rounded-[2.5rem] overflow-hidden flex flex-col relative no-spotlight"
                >
                   <CardContent className="p-8 space-y-6 flex-1 flex flex-col relative z-10">
                      <div className="flex items-start justify-between">
                         <div className="space-y-1">
                            <h3 className="font-black text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-widest">{loan.purpose || "Facility"}</h3>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                               <Clock className="w-3 h-3 text-primary" />
                               {loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : "N/A"}
                            </p>
                         </div>
                         <div className="scale-90 origin-right">
                          {getStatusBadge(loan.status)}
                         </div>
                      </div>

                      <div className="py-5 px-6 bg-surface/10 rounded-[1.5rem] border border-border/5 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                         <div className="space-y-1">
                            <p className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-[0.2em]">Principal</p>
                            <div className="flex items-center gap-1 text-2xl font-black text-foreground tracking-tighter">
                               <IconCurrencyRupeeNepalese className="w-5 h-5 text-primary" />
                               {Number(loan.requestedAmount).toLocaleString()}
                            </div>
                         </div>
                         <div className="text-right space-y-1">
                            <p className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-[0.2em]">Tenor</p>
                            <p className="font-black text-xl text-foreground tracking-tighter uppercase">{loan.requestedTermMonths} <span className="text-[10px] font-black text-muted-foreground/60">Mo</span></p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-auto">
                         <div className="scale-75 origin-left opacity-90">
                           <BlockchainStatusBadge blockchainTxHash={(loan as any).blockchainTxHash || (loan as any).blockchain_tx_hash} />
                         </div>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-primary/5 hover:text-primary transition-all group/btn" 
                            onClick={() => navigate(`/borrower/loans/${loan.id}`)}
                         >
                            Audit <ChevronDown className="w-3 h-3 -rotate-90 group-hover/btn:translate-x-1 transition-transform" />
                         </Button>
                      </div>
                   </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="space-y-8 pb-12">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black text-foreground uppercase tracking-[0.2em]">Audit Log</h2>
              <div className="h-px flex-1 mx-6 bg-border/20 hidden sm:block" />
           </div>

           <Card className="bg-surface/20 backdrop-blur-md border border-border/10 rounded-[2.5rem] overflow-hidden no-spotlight shadow-soft">
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-border/5 bg-surface/10">
                             <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Registry.tx</th>
                             <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Balance.val</th>
                             <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">State.obj</th>
                             <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Timestamp</th>
                             <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-right">Verification</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-border/5">
                          {isTransactionsLoading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                   <td className="px-8 py-6"><Skeleton className="h-3 w-24" /></td>
                                   <td className="px-8 py-6"><Skeleton className="h-3 w-16" /></td>
                                   <td className="px-8 py-6"><Skeleton className="h-3 w-16" /></td>
                                   <td className="px-8 py-6"><Skeleton className="h-3 w-24" /></td>
                                   <td className="px-8 py-6"><Skeleton className="h-3 w-32 ml-auto" /></td>
                                </tr>
                             ))
                          ) : transactionsData?.length === 0 ? (
                             <tr>
                                <td colSpan={5} className="px-8 py-16 text-center text-muted-foreground/60 font-black uppercase tracking-widest text-[10px]">
                                   Network synchronization complete. 0 logs found.
                                </td>
                             </tr>
                          ) : (
                             transactionsData?.slice(0, 8).map((tx: any) => (
                                <tr key={tx.id} className="group hover:bg-primary/5 transition-all">
                                   <td className="px-8 py-5">
                                      <div className="flex items-center gap-3">
                                         <div className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs border border-current/10",
                                            tx.type === 'DISBURSEMENT' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                                         )}>
                                            {tx.type === 'DISBURSEMENT' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                         </div>
                                         <span className="font-black text-[10px] tracking-widest uppercase">{tx.type.replace('_', ' ')}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-5">
                                      <span className="font-black text-xs tracking-tighter flex items-center gap-1">
                                         <IconCurrencyRupeeNepalese className="w-3 h-3 text-primary" />
                                         {Number(tx.amount).toLocaleString()}
                                      </span>
                                   </td>
                                   <td className="px-8 py-5">
                                      <Badge className={cn(
                                         "rounded-full text-[8px] font-black px-2 py-0.5 uppercase tracking-widest border-none",
                                         tx.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                                      )}>
                                         {tx.status}
                                      </Badge>
                                   </td>
                                   <td className="px-8 py-5 text-[10px] text-muted-foreground/80 font-black uppercase tracking-widest">
                                      {format(new Date(tx.createdAt), "MMM dd, yy")}
                                   </td>
                                   <td className="px-8 py-5 text-right">
                                      <div className="flex justify-end scale-[0.65] origin-right opacity-80 group-hover:opacity-100 transition-opacity">
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
