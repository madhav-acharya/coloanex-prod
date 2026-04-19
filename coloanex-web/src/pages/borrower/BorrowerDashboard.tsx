import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Building2, FileText, Bell, ShieldCheck, ChevronRight, MapPin, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function BorrowerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: lendersData, isLoading: isLoadingLenders } = useGetTenantsQuery({ limit: 6, page: 1 });
  const unreadCount = 0; // Stubbed for now

  const lenders = lendersData?.data || [];
  const activeLenders = lenders.filter((l) => l.isActive).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const stats = [
    { label: "Lenders", value: lenders.length, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
    { label: "Active", value: activeLenders, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Alerts", value: unreadCount, icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const quickActions = [
    { label: "Lenders", icon: Building2, path: "/borrower/lenders", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "My Loans", icon: FileText, path: "/borrower/my-loans", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];


  return (
    <BorrowerLayout
      title={`${greeting}, ${user?.fullName?.split(" ")[0] || "Welcome"}`}
      description="Explore trusted lenders and secure your financial future with smart-contract backed loans."
    >
      <div className="space-y-12">
        {/* Stats Grid */}
        <section className="animate-fade-up">
          <div className="flex items-center justify-between mb-8 px-2">
             <h2 className="text-lg font-black text-foreground uppercase tracking-[0.2em]">Market Pulse</h2>
             <div className="h-px flex-1 mx-6 bg-border/20 hidden sm:block" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <Card key={i} className="group border-border/10 bg-surface/30 backdrop-blur-md transition-colors duration-300 rounded-[2.5rem] overflow-hidden no-spotlight">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 border border-current/10`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter">{stat.value}</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Lenders */}
        <section className="animate-fade-up delay-200 pb-12">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-lg font-black text-foreground uppercase tracking-[0.2em]">Active Partners</h2>
            <Link to="/borrower/lenders" className="group flex items-center gap-2 text-[10px] font-black text-primary hover:opacity-80 transition-all uppercase tracking-widest">
              View All <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {isLoadingLenders ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />
                ))
             ) : lenders.length === 0 ? (
                <div className="col-span-full py-20 bg-surface/20 rounded-[2.5rem] border border-dashed border-border/20 flex flex-col items-center justify-center text-muted-foreground">
                  <Building2 className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-base font-black uppercase tracking-widest">No lending partners found</p>
                </div>
             ) : (
                lenders.map(lender => (
                  <Card 
                    key={lender.id} 
                    className="group border-border/10 bg-surface/20 backdrop-blur-md hover:border-primary/20 transition-all duration-500 rounded-[2.5rem] cursor-pointer overflow-hidden flex flex-col no-spotlight"
                    onClick={() => navigate(`/borrower/lenders/${lender.id}`)}
                  >
                     <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between">
                           <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
                               {(lender as any).logo ? (
                                 <img src={(lender as any).logo} alt={lender.name} className="w-full h-full object-cover" />
                               ) : (
                                 <span className="text-xl font-black text-primary">{lender.name.charAt(0)}</span>
                               )}
                           </div>
                           <Badge variant={lender.isActive ? "default" : "secondary"} className={cn(
                              "rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest",
                              lender.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" : "bg-muted text-muted-foreground"
                           )}>
                              {lender.isActive ? "Active" : "Inactive"}
                           </Badge>
                        </div>
                        
                        <div className="space-y-2 flex-1">
                           <h3 className="text-lg font-black uppercase tracking-widest group-hover:text-primary transition-colors">{lender.name}</h3>
                           <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                              {(lender as any).description || "Trusted lending institution providing digital credit solutions."}
                           </p>
                        </div>

                        <div className="pt-6 border-t border-border/5 flex items-center justify-between group/footer">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              <MapPin className="w-3 h-3" /> {lender.address || "Global"}
                           </div>
                           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover/footer:bg-primary group-hover/footer:text-white transition-all duration-300">
                              <ArrowRight className="w-4 h-4 -rotate-45" />
                           </div>
                        </div>
                     </CardContent>
                  </Card>
                ))
             )}
          </div>
        </section>
      </div>
    </BorrowerLayout>
  );
}
