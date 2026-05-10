import React, { useState, useEffect } from "react";
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

interface SharedHeaderProps {
  variant: "public" | "borrower";
}

const publicNavLinks = [
  { label: "Home", to: "/", icon: Home, anchor: "home" },
  { label: "Services", to: "/#services", icon: Layers, anchor: "services" },
  { label: "How It Works", to: "/#how-it-works", icon: HandCoins, anchor: "how-it-works" },
  { label: "Features", to: "/#features", icon: Layers, anchor: "features" },
  { label: "Security", to: "/#security", icon: ShieldCheck, anchor: "security" },
  { label: "Pricing", to: "/#pricing", icon: Zap, anchor: "pricing" },
];

const borrowerNavLinks = [
  { label: "Dashboard", to: "/dashboard", icon: Home, anchor: "" },
  { label: "Lenders", to: "/lenders", icon: Users, anchor: "" },
  { label: "Loans", to: "/my-loans", icon: HandCoins, anchor: "" },
  { label: "KYC", to: "/kyc", icon: ShieldCheck, anchor: "" },
];

const routeSectionMap: Record<string, string> = {
  "/": "home",
  "/services": "services",
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
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const userHomeRoute = user ? getHomeRoute(user as any) : "/dashboard";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/lenders?search=${encodeURIComponent(searchText.trim())}`);
      setSearchText("");
    }
  };

  useEffect(() => {
    const orderedSections = ["home", "services", "how-it-works", "features", "security", "pricing"];
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      if (location.pathname !== "/") {
        setActiveSection(routeSectionMap[location.pathname] || "");
        return;
      }
      const scrollPosition = window.scrollY + 160;
      let current = "home";
      for (const section of orderedSections) {
        const el = document.getElementById(section);
        if (!el) continue;
        if (el.offsetTop <= scrollPosition) current = section;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;
    const id = location.hash.replace("#", "");
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
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
      if (routeSectionMap[location.pathname]) return routeSectionMap[location.pathname] === anchor;
      if (anchor === "home") return location.pathname === "/";
    }
    return location.pathname === to || (to !== "/" && location.pathname.startsWith(`${to}`));
  };

  const navLinkClass = (active: boolean) =>
    cn(
      "relative flex items-center justify-center h-full sm:px-10 md:px-14 lg:px-16 transition-all group cursor-pointer",
      active ? "text-primary" : "text-muted-foreground hover:bg-muted/40"
    );

  const activeIndicator = (active: boolean) => 
    active && (
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
    );

  const TooltipButton = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="relative group/tooltip flex items-center justify-center h-full w-full">
      {children}
      <div className="absolute top-14 scale-0 group-hover/tooltip:scale-100 transition-all bg-foreground text-background px-2 py-1 rounded text-[11px] font-bold whitespace-nowrap z-[200]">
        {title}
      </div>
    </div>
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-md border-b transition-colors duration-300 ${scrolled ? "border-border" : "border-transparent"}`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-3 h-14">
            {/* Left: Logo and Search */}
            <div className="flex items-center gap-3">
              <Link to={variant === "borrower" ? "/dashboard" : "/"} className="shrink-0 cursor-pointer">
                <div className="w-10 h-10 flex items-center justify-center transition-transform hover:scale-105">
                  <img src="/images/logo.png" alt="Coloanex" className="w-full h-full object-contain" />
                </div>
              </Link>
              <form onSubmit={handleSearch} className="relative hidden sm:flex items-center w-full max-w-[200px] xl:max-w-[280px]">
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer z-10">
                  <Search className="w-full h-full" />
                </button>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={variant === "borrower" ? "Search" : "Search"}
                  className="w-full h-9 bg-muted/50 border-none rounded-full pl-9 pr-4 text-sm focus:bg-muted focus:ring-0 transition-all placeholder:text-muted-foreground/60 hidden md:block"
                />
                <div className="md:hidden w-9 h-9 flex items-center justify-center bg-muted/50 rounded-full cursor-pointer hover:bg-muted">
                   <Search className="w-4 h-4 text-muted-foreground" />
                </div>
              </form>
            </div>
 
            {/* Center: Icons */}
            <div className="flex items-center justify-center h-full hidden lg:flex">
              <div className="flex items-center justify-center h-full">
                {(variant === "borrower" ? borrowerNavLinks : publicNavLinks).map((link) => {
                  const active = isActiveLink(link.to, link.anchor || "");
                  return (
                    <div key={link.label} className="h-full relative flex items-center">
                      <TooltipButton title={link.label}>
                          <button
                            type="button"
                            onClick={() => handleNavClick(link)}
                            className={navLinkClass(active)}
                          >
                            <link.icon className={cn("w-6 h-6", active ? "text-primary" : "text-muted-foreground")} />
                            {activeIndicator(active)}
                          </button>
                      </TooltipButton>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-2">
              <div className="hidden lg:flex items-center gap-2">
                <TooltipButton title="Switch Theme">
                   <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer">
                     <ThemeSwitcher />
                   </div>
                </TooltipButton>
                
                {user ? (
                  <>
                    <TooltipButton title="Notifications">
                       <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer relative">
                         <NotificationsDropdown />
                       </div>
                    </TooltipButton>
                    
                    <TooltipButton title="Dashboard">
                       <Link to={userHomeRoute} className="cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer">
                             <LayoutDashboard className="w-5 h-5" />
                          </div>
                       </Link>
                    </TooltipButton>

                    <TooltipButton title="Account">
                       <div className="relative cursor-pointer">
                          <ProfileDropdown avatarOnly={true} />
                       </div>
                    </TooltipButton>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="rounded-full h-10 px-5 font-bold hover:bg-muted cursor-pointer"
                      onClick={() => setIsAuthModalOpen(true)}
                    >
                      Login
                    </Button>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 rounded-full font-bold transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setIsAuthModalOpen(true)}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Trigger */}
              <div className="lg:hidden flex items-center gap-2">
                <ThemeSwitcher />
                {user && <NotificationsDropdown />}
                <button
                  className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="header-separator" />
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div
            className="fixed inset-0 bg-black/55 animate-in fade-in duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[78%] sm:w-[72%] max-w-[300px] h-full bg-[#08162b] border-r border-[#12355f] shadow-none flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/30">
              <Link
                to={variant === "borrower" ? "/dashboard" : "/"}
                className="flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  <img src="/images/logo.png" alt="Coloanex" className="w-full h-full" />
                </div>
                <span className="font-bold text-foreground text-sm">Coloanex</span>
              </Link>
              <button
                className="p-1.5 text-foreground/80 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {variant === "public" &&
                publicNavLinks.map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    className={`w-full text-left py-2.5 px-3 text-sm transition-colors ${
                      isActiveLink(link.to, link.anchor)
                        ? "text-primary font-semibold bg-primary/10"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted/30"
                    }`}
                    onClick={() => handleNavClick(link)}
                  >
                    {link.label}
                  </button>
                ))}

              {user && (
                <>
                  <div className="h-px bg-border/20 my-2" />
                  <Link
                    to={userHomeRoute}
                    className="flex items-center gap-3 py-2.5 px-3 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/30 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4 text-primary" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 py-2.5 px-3 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}

              {!user && (
                <>
                  <div className="h-px bg-border/20 my-2" />
                  <button
                    type="button"
                    className="w-full text-left py-2.5 px-3 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/30 transition-colors"
                    onClick={() => { setMobileMenuOpen(false); setIsAuthModalOpen(true); }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="w-full text-left py-2.5 px-3 text-sm text-primary font-semibold hover:bg-primary/10 transition-colors"
                    onClick={() => { setMobileMenuOpen(false); setIsAuthModalOpen(true); }}
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
