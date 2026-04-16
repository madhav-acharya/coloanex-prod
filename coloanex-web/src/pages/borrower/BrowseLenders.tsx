import { useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, SlidersHorizontal, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
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

export default function BrowseLenders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showApply, setShowApply] = useState(false);

  const { data: tenantsData, isLoading } = useGetTenantsQuery({
    page,
    limit: 10,
    search,
  });

  const lenderTenants = tenantsData?.data?.filter(t => statusFilter === "all" ? true : t.isActive === (statusFilter === "active")) || [];
  const totalPages = Math.ceil((tenantsData?.total || 0) / 10);

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-plus-jakarta tracking-tight text-foreground">
            Browse Lenders
          </h1>
          <p className="text-muted-foreground text-lg">Find the perfect lender for your needs</p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-low/30 p-2 rounded-2xl border border-outline-variant/10">
           <div className="relative w-full md:max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input 
               placeholder="Search lenders..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9 bg-surface/50 border-outline-variant/20 focus-visible:ring-primary/30 rounded-xl"
             />
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="flex items-center gap-2 px-3 py-2 border border-outline-variant/20 rounded-xl bg-surface/50">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground/80">Filters</span>
             </div>
             
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-surface/50 border-outline-variant/20 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
             </Select>
           </div>
        </div>

        <Card className="border-border/40 shadow-sm bg-surface/50 overflow-hidden">
          <CardContent className="p-0">
            {/* Lender Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-surface-container-low/40 border border-outline-variant/15 flex flex-col h-64">
                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-32" />
                           <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-auto" />
                      <div className="flex gap-3 mt-4">
                         <Skeleton className="h-10 flex-1" />
                         <Skeleton className="h-10 flex-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : lenderTenants.length === 0 ? (
                 <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-outline-variant/30 rounded-xl">
                    No lenders found matching your criteria.
                 </div>
              ) : lenderTenants.map((lender) => (
                <Card key={lender.id} className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15 hover:border-primary/30 transition-all duration-300 group relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/15 transition-colors duration-500" />
                  
                  <CardContent className="p-6 flex flex-col flex-1">
                     <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                             {lender.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <h3 className="font-semibold text-lg text-foreground truncate">{lender.name}</h3>
                             <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {(lender as any).contactEmail || "Online"}
                             </p>
                           </div>
                        </div>
                        {lender.isActive ? (
                           <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">Active</span>
                        ) : (
                           <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-outline-variant/30 text-muted-foreground border border-outline-variant/30 rounded-full">Inactive</span>
                        )}
                     </div>

                     <div className="space-y-4 mb-8 flex-1">
                        <div className="flex items-center justify-between pb-3 border-b border-border/40">
                           <span className="text-sm text-muted-foreground">Joined On</span>
                           <span className="font-bold text-primary">{new Date(lender.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                           {(lender as any).description || "Trusted lending partner on CoLoanEx network."}
                        </div>
                     </div>

                     <div className="flex items-center gap-3 mt-auto">
                          <Button className="w-full" onClick={() => setShowApply(true)}>
                             Apply with {lender.name.split(' ')[0]}
                          </Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Pagination placeholder */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
             <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-8 h-8 p-0" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button 
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm" 
                    className={`w-8 h-8 p-0 ${page === i + 1 ? "bg-primary/20 text-primary border-primary/30" : ""}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-8 h-8 p-0"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
             </div>
          </div>
        )}
      </div>
      <ApplyLoanModal open={showApply} onOpenChange={setShowApply} />
    </BorrowerLayout>
  );
}
