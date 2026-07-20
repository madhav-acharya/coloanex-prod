import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Search,
  Home,
  Users,
  HandCoins,
  ShieldCheck,
  Layers,
  Zap,
  Route,
  BarChart3,
  LayoutGrid,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { AuthModal } from "@/components/modals/AuthModal";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { getHomeRoute } from "@/lib/roleUtils";
import { cn } from "@/lib/utils";
import { staggerChildren } from "@/utils/anime";

interface SharedHeaderProps {
  variant: "public" | "borrower";
}

const publicNavLinks = [
  { label: "Home", to: "/", icon: Home, anchor: "home" },
  { label: "Platform", to: "/#services", icon: Layers, anchor: "services" },
  { label: "How it works", to: "/#how-it-works", icon: Route, anchor: "how-it-works" },
  { label: "Features", to: "/#features", icon: LayoutGrid, anchor: "features" },
  { label: "Security", to: "/#security", icon: ShieldCheck, anchor: "security" },
  { label: "Pricing", to: "/#pricing", icon: Zap, anchor: "pricing" },
];

const borrowerNavLinks = [
  { label: "Dashboard", to: "/dashboard", icon: Home, anchor: "" },
  { label: "Lenders", to: "/lenders", icon: Users, anchor: "" },
  { label: "Loans", to: "/my-loans", icon: HandCoins, anchor: "" },
  { label: "KYC", to: "/kyc", icon: ShieldCheck, anchor: "" },
  { label: "Analytics", to: "/analytics", icon: BarChart3, anchor: "" },
];

const routeSectionMap: Record<string, string> = {
  "/": "home",
  "/how-it-works": "how-it-works",
  "/features": "features",
  "/security": "security",
  "/pricing": "pricing",
};

export default function Header({ variant }: SharedHeaderProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const navRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const userHomeRoute = user ? getHomeRoute(user as any) : "/dashboard";
  const links = variant === "borrower" ? borrowerNavLinks : publicNavLinks;

  useEffect(() => {
    if (!navRef.current) return;
    const items = navRef.current.querySelectorAll("[data-nav]");
    staggerChildren(Array.from(items) as HTMLElement[], { duration: 320 });
  }, [variant]);

  useEffect(() => {
    const orderedSections = [
      "home",
      "services",
      "how-it-works",
      "features",
      "security",
      "pricing",
    ];
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        setScrolled(window.scrollY > 8);
        if (location.pathname !== "/") {
          setActiveSection(routeSectionMap[location.pathname] || "");
          return;
        }
        const scrollPosition = window.scrollY + 140;
        let current = "home";
        for (const section of orderedSections) {
          const el = document.getElementById(section);
          if (!el) continue;
          if (el.offsetTop <= scrollPosition) current = section;
        }
        setActiveSection(current);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;
    const id = location.hash.replace("#", "");
    const timer = setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) {
      navigate(user ? "/lenders" : "/login");
      return;
    }
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/lenders?search=${q}`)}`);
      return;
    }
    navigate(`/lenders?search=${encodeURIComponent(q)}`);
    setSearchText("");
  };

  const handleNavClick = (item: { to: string; anchor: string }) => {
    setMobileMenuOpen(false);
    if (location.pathname === "/" && item.anchor) {
      const el = document.getElementById(item.anchor);
      if (el) {
        setActiveSection(item.anchor);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (window.location.hash !== `#${item.anchor}`) {
          window.history.replaceState(null, "", `/#${item.anchor}`);
        }
        return;
      }
    }
    navigate(item.to);
  };

  const isActiveLink = (to: string, anchor: string) => {
    if (anchor) {
      if (isHome) return activeSection === anchor;
      if (routeSectionMap[location.pathname])
        return routeSectionMap[location.pathname] === anchor;
      if (anchor === "home") return location.pathname === "/";
    }
    return (
      location.pathname === to ||
      (to !== "/" && location.pathname.startsWith(to))
    );
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] h-[56px] md:h-[60px] transition-colors duration-200 border-b",
          scrolled
            ? "bg-card border-border/60"
            : "bg-card/95 border-border/40",
        )}
      >
        <div className="mx-auto w-full max-w-[1920px] h-full px-3 sm:px-4 lg:px-5 flex items-center gap-2">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <Link
              to={variant === "borrower" ? "/dashboard" : "/"}
              className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden"
              aria-label="CoLoanEx home"
            >
              <img
                src="/images/logo.png"
                alt="CoLoanEx"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
              />
            </Link>
            <form
              onSubmit={handleSearch}
              className="relative hidden sm:flex items-center min-w-0 flex-1 max-w-[240px]"
            >
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search lenders"
                className="h-9 md:h-10 w-full min-w-[140px] rounded-full bg-muted/70 border-0 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </form>
          </div>

          <div
            ref={navRef}
            className="hidden md:flex flex-1 items-stretch justify-center h-full max-w-[680px] mx-auto"
          >
            {links.map((link) => {
              const active = isActiveLink(link.to, link.anchor || "");
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  data-nav
                  type="button"
                  onClick={() => handleNavClick(link)}
                  aria-label={link.label}
                  className={cn(
                    "group relative flex-1 h-full min-w-[72px] max-w-[112px] flex items-center justify-center transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-muted/60 rounded-lg my-1",
                  )}
                >
                  <Icon
                    className="w-7 h-7 lg:w-[28px] lg:h-[28px]"
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] z-[120] whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-xs font-semibold text-background opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 shadow-md">
                    {link.label}
                  </span>
                  {active && (
                    <span className="absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden sm:flex">
              <ThemeSwitcher />
            </div>

            {user ? (
              <div className="hidden md:flex items-center gap-1.5">
                <NotificationsDropdown />
                <Link
                  to={userHomeRoute}
                  className="group relative h-10 w-10 rounded-full bg-muted/70 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-[120] whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-xs font-semibold text-background opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    Dashboard
                  </span>
                </Link>
                <ProfileDropdown avatarOnly />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-9 px-3 rounded-full font-semibold text-sm"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  className="h-9 px-4 rounded-full font-bold text-sm"
                  onClick={() => navigate("/signup")}
                >
                  Get Started
                </Button>
              </div>
            )}

            <button
              type="button"
              className="md:hidden h-10 w-10 rounded-full bg-muted/70 flex items-center justify-center text-foreground"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Open menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[110] flex">
          <div
            className="fixed inset-0 bg-background/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[min(88vw,320px)] h-full bg-card border-r border-border flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/50">
              <Link
                to={variant === "borrower" ? "/dashboard" : "/"}
                onClick={() => setMobileMenuOpen(false)}
              >
                <img
                  src="/images/logo.png"
                  alt="CoLoanEx"
                  className="w-9 h-9 object-contain"
                />
              </Link>
              <button
                type="button"
                className="p-2 rounded-lg text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-3 pt-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search lenders"
                  className="h-11 w-full rounded-full bg-muted/70 border-0 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </form>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {links.map((link) => {
                const active = isActiveLink(link.to, link.anchor || "");
                const Icon = link.icon;
                return (
                  <button
                    key={link.label}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 text-left py-3.5 px-3 rounded-xl text-sm font-semibold transition-colors",
                      active
                        ? "text-primary bg-primary/10"
                        : "text-foreground/85 hover:bg-muted/50",
                    )}
                    onClick={() => handleNavClick(link)}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    {link.label}
                  </button>
                );
              })}

              <div className="h-px bg-border/50 my-3" />

              <div className="px-2 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Theme
                </span>
                <ThemeSwitcher />
              </div>

              {user ? (
                <>
                  <Link
                    to={userHomeRoute}
                    className="w-full flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-5 h-5 text-primary" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-semibold text-destructive"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="w-full text-left py-3 px-3 rounded-xl text-sm font-semibold"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="w-full text-left py-3 px-3 rounded-xl text-sm font-bold text-primary bg-primary/10"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/signup");
                    }}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
