import { useMemo, useState, useEffect } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function BrowseLenders() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data: tenantsData, isLoading } = useGetTenantsQuery({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  const lenderTenants =
    tenantsData?.data?.filter((t) =>
      statusFilter === "all"
        ? true
        : t.isActive === (statusFilter === "active"),
    ) || [];
  const totalPages = Math.ceil((tenantsData?.total || 0) / 10);
  const totalCount = tenantsData?.total || 0;
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

  const renderLenderCard = (lender: (typeof lenderTenants)[number]) => (
    <button
      key={lender.id}
      type="button"
      onClick={() => navigate(`/lenders/${lender.id}`)}
      className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {lender.logo ? (
              <img
                src={lender.logo}
                alt={lender.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-base font-bold text-primary">
                {lender.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {lender.name}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {lender.contactEmail || lender.address || "Lending partner"}
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest shrink-0",
            lender.isActive
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-muted/40 text-muted-foreground border-border",
          )}
        >
          {lender.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        {lender.contactEmail && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lender.contactEmail}</span>
          </div>
        )}
        {lender.contactPhone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>{lender.contactPhone}</span>
          </div>
        )}
        {lender.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lender.address}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-primary">
        <span>View Details</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );

  const renderPagination = () =>
    totalPages > 1 ? (
      <div className="flex justify-center">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "ghost"}
              className={cn(
                "h-8 w-8 text-xs",
                page === i + 1 && "bg-primary text-primary-foreground",
              )}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <BorrowerLayout>
      <div className="space-y-6">
        <section className="bg-primary/5 border border-border rounded-xl p-5 md:p-6 mb-2">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="space-y-2 flex-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors mb-2">Smart Lending Guide</Badge>
              <h2 className="text-xl font-bold text-foreground">Discover the Perfect Loan Partner</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect with verified financial institutions tailored to your specific needs. Each lender on our platform undergoes a rigorous vetting process to ensure transparency and security for your financial journey.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <div className="bg-card border border-border/40 rounded-xl px-4 py-3 flex flex-col items-center justify-center min-w-[100px] shadow-sm">
                <span className="text-lg font-bold text-primary">0%</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Hidden Fees</span>
              </div>
              <div className="bg-card border border-border/40 rounded-xl px-4 py-3 flex flex-col items-center justify-center min-w-[100px] shadow-sm">
                <span className="text-lg font-bold text-emerald-500">24h</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Avg Response</span>
              </div>
            </div>
          </div>
        </section>

        <div className="lg:hidden space-y-4">
          <div className="relative z-[120]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lenders"
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-border bg-card pl-10"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-[130] mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSearch(item.name);
                      setDebouncedSearch(item.name);
                      setShowSuggestions(false);
                    }}
                  >
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.contactEmail || item.address || "Lender"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "inactive", label: "Inactive" },
            ].map((item) => (
              <Button
                key={item.key}
                type="button"
                size="sm"
                variant={statusFilter === item.key ? "default" : "outline"}
                className="h-8 whitespace-nowrap px-4 rounded-full"
                onClick={() => {
                  setStatusFilter(item.key);
                  setPage(1);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : lenderTenants.length === 0 ? (
            <Card className="rounded-xl border border-border bg-card shadow-sm">
              <CardContent className="p-6 text-center">
                <Search className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No lenders found
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lenderTenants.map(renderLenderCard)}
            </div>
          )}

          {renderPagination()}
        </div>

        <div className="hidden lg:block space-y-6">
          <Card className="overflow-visible rounded-xl border border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
                <div className="relative z-[120]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by lender name, city, or email"
                    value={search}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 120)
                    }
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="h-11 rounded-xl border border-border bg-muted/20 pl-10"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[130] mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                      {suggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSearch(item.name);
                            setDebouncedSearch(item.name);
                            setShowSuggestions(false);
                          }}
                        >
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.contactEmail || item.address || "Lender"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center gap-2 text-sm">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All lenders</SelectItem>
                    <SelectItem value="active">Verified only</SelectItem>
                    <SelectItem value="inactive">Inactive only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{totalCount} lenders available</span>
                <span>
                  Showing {lenderTenants.length} of {totalCount}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 w-full rounded-xl" />
              ))
            ) : lenderTenants.length === 0 ? (
              <Card className="col-span-full rounded-xl border-dashed border-border bg-card shadow-sm">
                <CardContent className="py-16 text-center">
                  <Search className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    No lenders matched your filters
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try switching status filter or using a shorter search
                    keyword.
                  </p>
                </CardContent>
              </Card>
            ) : (
              lenderTenants.map(renderLenderCard)
            )}
          </div>

          {renderPagination()}
        </div>
      </div>
    </BorrowerLayout>
  );
}
