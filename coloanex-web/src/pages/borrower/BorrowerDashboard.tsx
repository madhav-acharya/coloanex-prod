import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Building2, FileText, Bell, ShieldCheck, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
// useNotifications hook temporarily stubbed or removed
import { Badge } from "@/components/ui/badge";

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
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Hero Section */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-muted-foreground text-lg mb-1">{greeting},</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {user?.fullName?.split(" ")[0] || "Welcome"}
            </h1>
            <p className="text-muted-foreground mt-2">Find the best loan for you</p>
          </div>
          <Link to="/borrower/profile" className="w-12 h-12 rounded-full bg-surface border border-border/50 flex items-center justify-center relative hover:bg-muted/50 transition">
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
               <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm border-2 border-background">
                 {unreadCount > 99 ? '99+' : unreadCount}
               </span>
            )}
          </Link>
        </div>

        {/* Overview Stats */}
        <div>
          <h2 className="text-xl font-bold mb-4">Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <Card key={i} className="border-border/40 shadow-sm bg-surface/50">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground mt-1 font-semibold">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
           <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
           <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action, i) => (
                 <Button
                    key={i}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-3 border-border/40 shadow-sm bg-surface/50 hover:bg-muted/50 transition-all rounded-xl"
                    onClick={() => {
                       if (action.path) {
                          navigate(action.path);
                       }
                    }}
                 >
                    <div className={`w-10 h-10 rounded-full ${action.bg} ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">{action.label}</span>
                 </Button>
              ))}
           </div>
        </div>

        {/* Featured Lenders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Featured Lenders</h2>
            <Link to="/borrower/lenders" className="text-sm font-semibold text-primary hover:underline">
              See all
            </Link>
          </div>
          
          <div className="space-y-3">
             {isLoadingLenders ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))
             ) : lenders.length === 0 ? (
                <div className="py-12 bg-surface/30 rounded-xl border border-border/40 flex flex-col items-center justify-center text-muted-foreground">
                  <Building2 className="w-12 h-12 mb-3 opacity-20" />
                  <p>No lenders available</p>
                </div>
             ) : (
                lenders.map(lender => (
                  <Card 
                    key={lender.id} 
                    className="border-border/40 shadow-sm bg-surface/50 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/borrower/lenders/${lender.id}`)}
                  >
                     <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {(lender as any).logo ? (
                                <img src={(lender as any).logo} alt={lender.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl font-black text-primary">{lender.name.charAt(0)}</span>
                              )}
                           </div>
                           <div>
                              <h3 className="font-bold text-base">{lender.name}</h3>
                              {lender.address && <p className="text-xs text-muted-foreground mt-0.5">{lender.address}</p>}
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <Badge variant={lender.isActive ? "default" : "secondary"} className={lender.isActive ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}>
                              {lender.isActive ? "Active" : "Inactive"}
                           </Badge>
                           <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                     </CardContent>
                  </Card>
                ))
             )}
          </div>
        </div>

      </div>
    </BorrowerLayout>
  );
}
