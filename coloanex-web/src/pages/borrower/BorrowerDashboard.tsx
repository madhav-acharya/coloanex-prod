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
      <div className="space-y-16">
        
        {/* Glassmorphic Stats Grid */}
        <section className="animate-fade-up">
          <div className="flex items-center justify-between mb-8 px-2">
             <h2 className="text-2xl font-black font-headline text-foreground">Live Market Metrics</h2>
             <div className="h-px flex-1 mx-6 bg-border/40 hidden sm:block" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <Card key={i} className="group border-border/40 shadow-soft bg-surface/40 backdrop-blur-xl hover:shadow-xl hover:border-primary/30 transition-all duration-500 rounded-3xl overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity ${stat.bg}`} />
                <CardContent className="p-8 flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative`}>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <stat.icon className="w-7 h-7 relative z-10" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Lenders - New Layout */}
        <section className="animate-fade-up delay-200">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-2xl font-black font-headline text-foreground">Featured Lending Partners</h2>
            <Link to="/borrower/lenders" className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors">
              Explore All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {isLoadingLenders ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />
                ))
             ) : lenders.length === 0 ? (
                <div className="col-span-full py-20 bg-surface/30 rounded-[2rem] border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-muted-foreground">
                  <Building2 className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-lg font-bold">No lending partners found</p>
                </div>
             ) : (
                lenders.map(lender => (
                  <Card 
                    key={lender.id} 
                    className="group border-border/40 shadow-soft bg-surface/40 backdrop-blur-xl hover:shadow-2xl hover:border-primary/40 transition-all duration-500 rounded-[2rem] cursor-pointer overflow-hidden flex flex-col"
                    onClick={() => navigate(`/borrower/lenders/${lender.id}`)}
                  >
                     <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between">
                           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-110 transition-transform duration-500">
                              {(lender as any).logo ? (
                                <img src={(lender as any).logo} alt={lender.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl font-black text-primary">{lender.name.charAt(0)}</span>
                              )}
                           </div>
                           <Badge variant={lender.isActive ? "default" : "secondary"} className={cn(
                              "rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                              lender.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border/40"
                           )}>
                              {lender.isActive ? "Active Partner" : "Inactive"}
                           </Badge>
                        </div>
                        
                        <div className="space-y-2 flex-1">
                           <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{lender.name}</h3>
                           <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {(lender as any).description || "Trusted lending institution providing digital credit solutions."}
                           </p>
                        </div>

                        <div className="pt-6 border-t border-border/40 flex items-center justify-between group/footer">
                           <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" /> {lender.address || "Digital Operations"}
                           </div>
                           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover/footer:bg-primary group-hover/footer:text-white transition-all duration-300">
                              <ArrowRight className="w-5 h-5 -rotate-45" />
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
