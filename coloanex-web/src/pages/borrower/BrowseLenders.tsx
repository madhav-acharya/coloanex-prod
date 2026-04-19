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
      <div className="space-y-12">

        {/* Filters row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface/30 backdrop-blur-xl p-4 md:p-6 rounded-[2.5rem] border border-border/10 sticky top-24 z-30 animate-fade-up no-spotlight shadow-soft">
           <div className="relative w-full md:max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-60" />
              <Input 
                placeholder="Locate institutional partners..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-14 h-14 bg-surface/20 border-transparent focus-visible:ring-primary/10 rounded-2xl text-base font-bold placeholder:text-muted-foreground/30 transition-all font-medium"
              />
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="h-14 w-full md:w-[200px] bg-surface/20 border-transparent rounded-2xl font-black text-[10px] uppercase tracking-widest">
                    <div className="flex items-center gap-3">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                      <SelectValue placeholder="Status" />
                    </div>
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl border-border/10 backdrop-blur-xl bg-surface/90">
                    <SelectItem value="all" className="rounded-xl font-bold uppercase tracking-widest text-[9px]">All Entities</SelectItem>
                    <SelectItem value="active" className="rounded-xl font-bold uppercase tracking-widest text-[9px]">Verified</SelectItem>
                    <SelectItem value="inactive" className="rounded-xl font-bold uppercase tracking-widest text-[9px]">Inactive</SelectItem>
                 </SelectContent>
              </Select>
           </div>
        </div>

        {/* Lender Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up delay-100">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />
            ))
          ) : lenderTenants.length === 0 ? (
             <div className="col-span-full py-24 text-center border border-dashed border-border/10 rounded-[2.5rem] bg-surface/10 animate-fade-in no-spotlight">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Search className="w-8 h-8 text-primary opacity-20" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest">Zero Match Found</h3>
                <p className="text-muted-foreground font-medium text-sm mt-4">Refine your institutional search criteria.</p>
             </div>
          ) : lenderTenants.map((lender) => (
            <Card 
              key={lender.id} 
              className="group bg-surface/20 backdrop-blur-md border border-border/10 hover:border-primary/20 transition-all duration-700 rounded-[2.5rem] overflow-hidden flex flex-col relative no-spotlight"
              onClick={() => navigate(`/borrower/lenders/${lender.id}`)}
            >
              <CardContent className="p-8 flex flex-col flex-1 relative z-10">
                 <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-2xl group-hover:scale-105 transition-all duration-500">
                      {lender.name.charAt(0).toUpperCase()}
                    </div>
                    {lender.isActive ? (
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full font-black text-[9px] tracking-widest uppercase px-3 py-1">Verified</Badge>
                    ) : (
                       <Badge variant="outline" className="rounded-full font-black text-[9px] tracking-widest uppercase px-3 py-1 border-border/10 text-muted-foreground/60">Registry</Badge>
                    )}
                 </div>

                 <div className="space-y-3 mb-8 flex-1">
                    <div>
                       <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight uppercase tracking-widest">{lender.name}</h3>
                       <p className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/60 mt-3 uppercase tracking-[0.1em]">
                          <MapPin className="w-3 h-3 text-primary" />
                          {(lender as any).contactEmail || "On-Chain Participant"}
                       </p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                       {(lender as any).description || "Institutional lending partner providing decentralized credit facilities."}
                    </p>
                 </div>

                 <div className="pt-6 border-t border-border/5 flex items-center justify-between group/action">
                    <div className="space-y-0.5">
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Registered Since</p>
                       <p className="text-xs font-black text-foreground uppercase tracking-wider">{new Date(lender.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                       <ChevronRight className="w-5 h-5" />
                    </div>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-8 animate-fade-in pb-12">
             <div className="flex items-center gap-2 p-1.5 bg-surface/30 backdrop-blur-md rounded-2xl border border-border/10 no-spotlight shadow-soft">
                <Button 
                   variant="ghost" 
                   size="icon" 
                   className="rounded-xl w-9 h-9" 
                   disabled={page === 1}
                   onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button 
                    key={i}
                    variant={page === i + 1 ? "default" : "ghost"}
                    className={cn(
                       "w-9 h-9 rounded-xl font-black text-[10px] uppercase",
                       page === i + 1 ? "bg-primary text-white" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                    )}
                    onClick={(e) => { e.stopPropagation(); setPage(i + 1); }}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button 
                   variant="ghost" 
                   size="icon"
                   className="rounded-xl w-9 h-9"
                   disabled={page === totalPages}
                   onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
             </div>
          </div>
        )}
      </div>
    </BorrowerLayout>
  );
}
