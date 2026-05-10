import { useMemo, useState, useEffect } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Search,
  Building2,
  ExternalLink
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function BrowseLenders() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("search") || "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    if (initialSearch && initialSearch !== search) {
      setSearch(initialSearch);
      setDebouncedSearch(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data: tenantsData, isLoading } = useGetTenantsQuery({
    page,
    limit: 12,
    search: debouncedSearch,
  });

  const lenderTenants =
    tenantsData?.data?.filter((t) =>
      statusFilter === "all"
        ? true
        : t.isActive === (statusFilter === "active"),
    ) || [];
  
  const totalCount = tenantsData?.total || 10;
  const totalPages = Math.ceil((tenantsData?.total || 0) / 12);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const seen = new Set<string>();
    return lenderTenants
      .filter((l) => l.name.toLowerCase().includes(q))
      .filter((l) => {
        if (seen.has(l.name)) return false;
        seen.add(l.name);
        return true;
      })
      .slice(0, 5);
  }, [search, lenderTenants]);

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-12">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8 mt-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-muted-foreground  tracking-wider px-1">Marketplace</h2>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Lender Directory</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64 lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search lenders..."
                value={search}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-xl border-border/60 bg-background/50 pl-10 font-medium placeholder:text-muted-foreground/60 focus-visible:ring-primary/20"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[130] mt-2 w-full overflow-hidden rounded-xl border border-border/60 bg-background shadow-none">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      className="w-full px-4 py-2.5 text-left transition-colors hover:bg-muted/40 border-b border-border/20 last:border-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearch(item.name);
                        setDebouncedSearch(item.name);
                        setShowSuggestions(false);
                      }}
                    >
                      <p className="text-sm font-bold text-foreground">{item.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex bg-muted/30 p-1 rounded-xl ring-1 ring-border/40">
              {['all', 'active', 'inactive'].map((key) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all capitalize tracking-wider",
                    statusFilter === key 
                      ? "bg-background text-foreground shadow-none ring-1 ring-border/20" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl bg-muted/40" />
            ))
          ) : lenderTenants.length === 0 ? (
            <div className="col-span-full py-20 rounded-2xl border-2 border-dashed border-border/40 text-center flex flex-col items-center">
              <Building2 className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-bold text-foreground">No Lenders Found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">Adjust your search or filters to see more results.</p>
            </div>
          ) : (
            lenderTenants.map((lender) => (
              <LenderCard key={lender.id} lender={lender} onClick={() => navigate(`/lenders/${lender.id}`)} />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center pt-10">
            <div className="flex items-center gap-1.5 bg-muted/30 p-1.5 rounded-xl border border-border/40">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-9 h-9 rounded-lg font-bold transition-all",
                    page === i + 1 ? "shadow-none bg-background text-foreground ring-1 ring-border" : "text-muted-foreground hover:bg-background/50",
                  )}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </BorrowerLayout>
  );
}

function LenderCard({ lender, onClick }: { lender: any; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group bg-background border border-border/60 hover:border-primary/40 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-none hover:-translate-y-1 flex flex-col"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center overflow-hidden shrink-0 text-xl font-bold text-primary shadow-none bg-background">
          {lender.logo ? <img src={lender.logo} alt={lender.name} className="w-full h-full object-cover" /> : lender.name.charAt(0).toUpperCase()}
        </div>
        <div className={cn(
          "px-2.5 py-1 rounded-full text-[11px] font-bold  tracking-wider",
          lender.isActive ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20" : "bg-muted text-muted-foreground ring-1 ring-border/40"
        )}>
          {lender.isActive ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">{lender.name}</h3>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed h-[36px]">
          {lender.description || "Verified institutional lender on the CoLoanEx platform."}
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-border/40 space-y-2.5">
        <InfoEntry icon={<MapPin className="w-3.5 h-3.5" />} text={lender.address || "Main Office"} />
        <InfoEntry icon={<Mail className="w-3.5 h-3.5" />} text={lender.contactEmail || "contact@lender.com"} />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[11px] font-bold  tracking-wider text-muted-foreground/60">Profile ID: {lender.id.slice(0, 8)}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-none">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function InfoEntry({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground/80  tracking-wider">
      <div className="shrink-0">{icon}</div>
      <span className="truncate">{text}</span>
    </div>
  );
}
