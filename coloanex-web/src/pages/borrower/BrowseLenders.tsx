import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail, MapPin, Search, Building2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

export default function BrowseLenders() {
  const navigate = useNavigate();
  const location = useLocation();
  const revealRef = useRevealOnMount([]);
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
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="lattice"
            density={22}
            className="opacity-40 h-[280px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Lender Directory"
              description="Browse verified institutional lenders on the marketplace"
              actions={
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64 lg:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search lenders..."
                      value={search}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 120)
                      }
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="h-11 rounded-2xl border-border/60 bg-card/60 pl-10 font-medium"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-[130] mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-none">
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
                            <p className="text-sm font-bold text-foreground">
                              {item.name}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex bg-muted/40 p-1 rounded-2xl border border-border/40">
                    {["all", "active", "inactive"].map((key) => (
                      <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[11px] font-bold transition-all capitalize tracking-wider min-h-[40px]",
                          statusFilter === key
                            ? "bg-card text-foreground border border-border/40"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
          </ParallaxLayer>

          <Bone name="borrower-browse-lenders" loading={isLoading} minHeight={320}>
            <div
              ref={revealRef as React.RefObject<HTMLDivElement>}
              className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
            >
              {lenderTenants.length === 0 ? (
                <div className="col-span-full py-20 rounded-2xl border border-dashed border-border/50 text-center flex flex-col items-center bg-card/40">
                  <Building2 className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-bold text-foreground font-[family-name:var(--font-headline)]">
                    No Lenders Found
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Adjust your search or filters to see more results.
                  </p>
                </div>
              ) : (
                lenderTenants.map((lender) => (
                  <div key={lender.id} data-reveal>
                    <LenderCard
                      lender={lender}
                      onClick={() => navigate(`/lenders/${lender.id}`)}
                    />
                  </div>
                ))
              )}
            </div>
          </Bone>

          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <div className="flex items-center gap-1.5 bg-muted/30 p-1.5 rounded-2xl border border-border/40">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-10 h-10 rounded-xl font-bold transition-all",
                      page === i + 1
                        ? "shadow-none"
                        : "text-muted-foreground hover:bg-card/50",
                    )}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}

function LenderCard({
  lender,
  onClick,
}: {
  lender: {
    id: string;
    name: string;
    logo?: string | null;
    description?: string | null;
    address?: string | null;
    contactEmail?: string | null;
    isActive?: boolean;
  };
  onClick: () => void;
}) {
  return (
    <GlassCard
      onClick={onClick}
      className="group p-5 flex flex-col h-full hover:border-primary/40 transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center overflow-hidden shrink-0 text-xl font-bold text-primary">
          {lender.logo ? (
            <img
              src={lender.logo}
              alt={lender.name}
              className="w-full h-full object-cover"
            />
          ) : (
            lender.name.charAt(0).toUpperCase()
          )}
        </div>
        <div
          className={cn(
            "px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider",
            lender.isActive
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {lender.isActive ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate font-[family-name:var(--font-headline)]">
          {lender.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed min-h-[36px]">
          {lender.description ||
            "Verified institutional lender on the CoLoanEx platform."}
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-border/40 space-y-2.5">
        <InfoEntry
          icon={<MapPin className="w-3.5 h-3.5" />}
          text={lender.address || "Main Office"}
        />
        <InfoEntry
          icon={<Mail className="w-3.5 h-3.5" />}
          text={lender.contactEmail || "contact@lender.com"}
        />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider text-muted-foreground/60">
          ID: {lender.id.slice(0, 8)}
        </span>
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </GlassCard>
  );
}

function InfoEntry({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground tracking-wider">
      <div className="shrink-0">{icon}</div>
      <span className="truncate">{text}</span>
    </div>
  );
}
