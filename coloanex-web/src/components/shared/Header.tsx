import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { AuthModal } from "@/components/modals/AuthModal";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { getHomeRoute } from "@/lib/roleUtils";

interface SharedHeaderProps {
  variant: "public" | "borrower";
}

const publicNavLinks = [
  { label: "Home", to: "/#home", anchor: "home" },
  { label: "Services", to: "/#services", anchor: "services" },
  { label: "How It Works", to: "/#how-it-works", anchor: "how-it-works" },
  { label: "Features", to: "/#features", anchor: "features" },
  { label: "Security", to: "/#security", anchor: "security" },
  { label: "Pricing", to: "/#pricing", anchor: "pricing" },
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
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const userHomeRoute = user ? getHomeRoute(user as any) : "/dashboard";

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

  const isActiveLink = (_to: string, anchor: string) => {
    if (isHome && anchor) return activeSection === anchor;
    if (anchor && routeSectionMap[location.pathname]) return routeSectionMap[location.pathname] === anchor;
    if (anchor === "home") return location.pathname === "/";
    return false;
  };

  const navLinkClass = (to: string, anchor: string) =>
    `cursor-pointer transition-colors text-sm font-medium ${
      isActiveLink(to, anchor)
        ? "text-primary font-bold border-b-2 border-primary pb-1"
        : "text-foreground/80 hover:text-foreground pb-1"
    }`;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-md border-b transition-colors duration-300 ${scrolled ? "border-border" : "border-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={variant === "borrower" ? "/dashboard" : "/"} className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/images/logo.png" alt="Coloanex" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-foreground text-lg tracking-tight">Coloanex</span>
            </Link>

            {variant === "public" && (
              <div className="hidden lg:flex items-center gap-6">
                {publicNavLinks.map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => handleNavClick(link)}
                    className={navLinkClass(link.to, link.anchor)}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            )}

            <div className="hidden lg:flex items-center gap-3">
              <ThemeSwitcher />
              {user ? (
                <>
                  <NotificationsDropdown />
                  <Link to={userHomeRoute}>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 cursor-pointer h-9">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-4 cursor-pointer h-9 border-0"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="text-foreground hover:bg-muted cursor-pointer"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    Login
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 cursor-pointer"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-1.5">
              <ThemeSwitcher />
              {user && <NotificationsDropdown />}
              {!user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Login
                </Button>
              )}
              <button
                className="p-2 text-foreground hover:text-primary cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
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
          <div className="relative w-[78%] sm:w-[72%] max-w-[300px] h-full bg-[#08162b] border-r border-[#12355f] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
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
