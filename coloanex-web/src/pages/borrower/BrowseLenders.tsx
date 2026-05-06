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
      onClick={() => navigate(`/borrower/lenders/${lender.id}`)}
      className="w-full rounded-2xl border border-border/30 bg-white/75 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {lender.logo ? (
              <img
                src={lender.logo}
                alt={lender.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-primary">
                {lender.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {lender.name}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {lender.contactEmail || lender.address || "Lending partner"}
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            "rounded-full px-3 py-1 text-[10px] uppercase tracking-widest",
            lender.isActive
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-muted/40 text-muted-foreground border-border",
          )}
        >
          {lender.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        {lender.contactEmail && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">{lender.contactEmail}</span>
          </div>
        )}
        {lender.contactPhone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" />
            <span>{lender.contactPhone}</span>
          </div>
        )}
        {lender.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{lender.address}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-primary">
        <span>View Details</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );

  return (
    <BorrowerLayout
      title="Lenders"
      description="Search and choose lending partners"
    >
      <div className="space-y-8 lg:space-y-12">
        <div className="lg:hidden space-y-4">
          <div className="relative z-[120]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lenders"
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-2xl border-border/30 bg-white/80 pl-10 shadow-sm"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-[130] mt-1 w-full overflow-hidden rounded-2xl border border-border/30 bg-card shadow-lg">
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
                className="h-8 whitespace-nowrap px-3"
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
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : lenderTenants.length === 0 ? (
            <Card className="rounded-[28px] border-border/30 bg-card shadow-sm">
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

          {totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-xl border border-border/20 bg-card p-1.5 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
                {Array.from({ length: totalPages })
                  .slice(0, 5)
                  .map((_, i) => {
                    const pageNo = i + 1;
                    return (
                      <Button
                        key={pageNo}
                        variant={page === pageNo ? "default" : "ghost"}
                        className={cn(
                          "h-8 w-8 text-xs",
                          page === pageNo &&
                            "bg-primary text-primary-foreground",
                        )}
                        onClick={() => setPage(pageNo)}
                      >
                        {pageNo}
                      </Button>
                    );
                  })}
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
          )}
        </div>

        <div className="hidden lg:block space-y-10">
          <Card className="overflow-visible rounded-[28px] border-border/30 bg-white/70 shadow-sm backdrop-blur-xl">
            <CardContent className="p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                <div className="relative z-[120]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                    className="h-12 rounded-2xl border-border/30 bg-white/80 pl-11 shadow-sm"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[130] mt-1 w-full overflow-hidden rounded-2xl border border-border/30 bg-card shadow-lg">
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
                  <SelectTrigger className="h-12 rounded-2xl border-border/30 bg-white/80 shadow-sm">
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
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{totalCount} lenders available</span>
                <span>
                  Showing {lenderTenants.length} of {totalCount}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))
            ) : lenderTenants.length === 0 ? (
              <Card className="col-span-full rounded-[28px] border-dashed border-border/30 bg-card shadow-sm">
                <CardContent className="py-20 text-center">
                  <Search className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
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

          {totalPages > 1 && (
            <div className="flex justify-center pb-2">
              <div className="flex items-center gap-2 rounded-xl border border-border/20 bg-card p-1.5 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage((p) => p - 1);
                  }}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "ghost"}
                    className={cn(
                      "h-8 w-8 text-xs",
                      page === i + 1 && "bg-primary text-primary-foreground",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPage(i + 1);
                    }}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === totalPages}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage((p) => p + 1);
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BorrowerLayout>
  );
}
