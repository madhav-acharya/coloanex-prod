import { useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, SlidersHorizontal, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplyLoanModal } from "./ApplyLoan";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function BrowseLenders() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const { data: tenantsData, isLoading } = useGetTenantsQuery({
    page,
    limit: 10,
    search,
  });

  const lenderTenants = tenantsData?.data?.filter(t => statusFilter === "all" ? true : t.isActive === (statusFilter === "active")) || [];
  const totalPages = Math.ceil((tenantsData?.total || 0) / 10);

  return (
    <BorrowerLayout
      title="Credit Marketplace"
      description="Partner with institutional lenders secured by institutional-grade blockchain infrastructure."
    >
      <div className="space-y-16">

        {/* Premium Filters row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface/40 backdrop-blur-2xl p-6 rounded-[3rem] border border-border/40 shadow-2xl sticky top-24 z-30 animate-fade-up">
           <div className="relative w-full md:max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-60" />
              <Input 
                placeholder="Locate institutional partners..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-16 h-16 bg-surface/20 border-transparent focus-visible:ring-primary/20 rounded-[2rem] text-lg font-bold placeholder:text-muted-foreground/30 transition-all shadow-inner"
              />
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="h-16 w-full md:w-[220px] bg-surface/20 border-transparent rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-inner">
                    <div className="flex items-center gap-3">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Commitment Status" />
                    </div>
                 </SelectTrigger>
                 <SelectContent className="rounded-3xl border-border/40 backdrop-blur-3xl p-2 bg-surface/80">
                    <SelectItem value="all" className="rounded-xl font-bold">All Entities</SelectItem>
                    <SelectItem value="active" className="rounded-xl font-bold">Verified Only</SelectItem>
                    <SelectItem value="inactive" className="rounded-xl font-bold">Inactive</SelectItem>
                 </SelectContent>
              </Select>
           </div>
        </div>

        {/* Lender Grid with Enhanced Fidelity */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fade-up delay-100">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-[3rem]" />
            ))
          ) : lenderTenants.length === 0 ? (
             <div className="col-span-full py-32 text-center border-2 border-dashed border-border/20 rounded-[3rem] bg-surface/10 animate-fade-in">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Search className="w-10 h-10 text-primary opacity-20" />
                </div>
                <h3 className="text-2xl font-black tracking-tighter">Zero Match Found</h3>
                <p className="text-muted-foreground font-medium">Refine your institutional search criteria.</p>
             </div>
          ) : lenderTenants.map((lender) => (
            <Card 
              key={lender.id} 
              className="group bg-surface/40 backdrop-blur-xl border border-border/40 hover:border-primary/40 hover:shadow-3xl transition-all duration-700 rounded-[3rem] overflow-hidden flex flex-col relative"
              onClick={() => navigate(`/borrower/lenders/${lender.id}`)}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-1000" />
              
              <CardContent className="p-10 flex flex-col flex-1 relative z-10">
                 <div className="flex items-start justify-between mb-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-3xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                      {lender.name.charAt(0).toUpperCase()}
                    </div>
                    {lender.isActive ? (
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full font-black text-[10px] tracking-[0.2em] uppercase px-4 py-1.5 shadow-sm">Certified</Badge>
                    ) : (
                       <Badge variant="outline" className="rounded-full font-black text-[10px] tracking-[0.2em] uppercase px-4 py-1.5 border-border/40 text-muted-foreground/60">Legacy</Badge>
                    )}
                 </div>

                 <div className="space-y-4 mb-8 flex-1">
                    <div>
                       <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-none">{lender.name}</h3>
                       <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mt-3 uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {(lender as any).contactEmail || "On-Chain Participant"}
                       </p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                       {(lender as any).description || "Institutional lending partner providing decentralized credit facilities."}
                    </p>
                 </div>

                 <div className="pt-6 border-t border-border/40 flex items-center justify-between group/action">
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Joined Network</p>
                       <p className="text-sm font-bold text-foreground">{new Date(lender.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                       <ChevronRight className="w-6 h-6" />
                    </div>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Pagination placeholder */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-12 animate-fade-in">
             <div className="flex items-center gap-3 p-2 bg-surface/40 backdrop-blur-md rounded-2xl border border-border/40">
                <Button 
                   variant="ghost" 
                   size="icon" 
                   className="rounded-xl w-10 h-10" 
                   disabled={page === 1}
                   onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button 
                    key={i}
                    variant={page === i + 1 ? "default" : "ghost"}
                    className={cn(
                       "w-10 h-10 rounded-xl font-bold",
                       page === i + 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                    onClick={(e) => { e.stopPropagation(); setPage(i + 1); }}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button 
                   variant="ghost" 
                   size="icon"
                   className="rounded-xl w-10 h-10"
                   disabled={page === totalPages}
                   onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
             </div>
          </div>
        )}
      </div>
    </BorrowerLayout>
  );
}
