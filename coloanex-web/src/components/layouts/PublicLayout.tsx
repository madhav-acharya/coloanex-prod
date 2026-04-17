import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { useState, useEffect } from "react";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Shield, Database, Users, Mail, Phone } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function PublicLayout({
  children,
  showHeader = true,
  showFooter = true,
}: PublicLayoutProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      const sections = ["home", "services", "how-it-works", "features", "use-cases", "security", "pricing"];
      let current = "";
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 3 && rect.bottom >= 0) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isHome = location.pathname === "/";

  const handleNavClick = (anchor: string) => {
    if (isHome || location.pathname !== "/login" && location.pathname !== "/signup") {
      const el = document.getElementById(anchor);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
        return;
      }
    }
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Home", to: "/", anchor: "home" },
    { label: "Services", to: "/#services", anchor: "services" },
    { label: "How It Works", to: "/how-it-works", anchor: "how-it-works" },
    { label: "Features", to: "/features", anchor: "features" },
    { label: "Use Cases", to: "/use-cases", anchor: "use-cases" },
    { label: "Security", to: "/security", anchor: "security" },
    { label: "Pricing", to: "/pricing", anchor: "pricing" },
  ];

  const isActiveLink = (to: string, anchor: string) => {
    if (isHome && anchor) {
        return activeSection === anchor;
    }
    if (!isHome && to !== "/") {
        return location.pathname === to.split("#")[0];
    }
    if (to === "/") return activeSection === "home" || (!activeSection && isHome);
    return false;
  };

  const navLinkClass = (to: string, anchor: string) =>
    `cursor-pointer transition-colors text-sm font-medium ${
      isActiveLink(to, anchor)
        ? "text-primary font-bold border-b-2 border-primary pb-1"
        : "text-foreground/80 hover:text-foreground pb-1"
    }`;

  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled || mobileMenuOpen
              ? "bg-background/90 backdrop-blur-md shadow-sm border-b border-border/40"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <img src="/images/logo.png" alt="Coloanex" className="w-full h-full" />
                </div>
                <span className="font-bold text-foreground text-lg tracking-tight">Coloanex</span>
              </Link>

              <div className="hidden lg:flex items-center gap-6">
                {navLinks.map((link) =>
                  link.anchor && isHome ? (
                    <button
                      key={link.label}
                      onClick={() => handleNavClick(link.anchor)}
                      className={navLinkClass(link.to, link.anchor || "")}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link key={link.label} to={link.to} className={navLinkClass(link.to, link.anchor || "")}>
                      {link.label}
                    </Link>
                  )
                )}
              </div>

              <div className="hidden lg:flex items-center gap-3">
                <ThemeSwitcher />
                {user ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="ghost" className="text-foreground hover:bg-muted">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border border-destructive"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="text-foreground hover:bg-muted"
                      onClick={() => setAuthModalOpen(true)}
                    >
                      Login
                    </Button>
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5"
                      onClick={() => setAuthModalOpen(true)}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>

              <button
                className="lg:hidden p-2 text-foreground hover:text-primary cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      )}

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[90%] sm:w-[85%] max-w-sm h-full bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-4 h-16 border-b border-border">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <img src="/images/logo.png" alt="Coloanex" className="w-full h-full" />
                </div>
                <span className="font-bold text-foreground text-lg">Coloanex</span>
              </Link>
              <button className="p-2 text-foreground/80 hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              {navLinks.map((link) =>
                link.anchor && isHome ? (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.anchor)}
                    className="w-full text-left cursor-pointer block py-3 px-2 text-foreground/80 hover:text-foreground hover:bg-muted transition-colors rounded-lg"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`block py-3 px-2 transition-colors rounded-lg ${isActiveLink(link.to, link.anchor || "") ? "text-primary font-bold bg-primary/5" : "text-foreground/80 hover:text-foreground hover:bg-muted"}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              )}

              <div className="flex items-center justify-between pt-4 pb-2 border-b border-border">
                <span className="text-sm font-medium text-foreground/70">Theme</span>
                <ThemeSwitcher />
              </div>

              <div className="flex flex-col gap-3 pt-6">
                {user ? (
                  <>
                    <Link to="/dashboard" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground border border-destructive"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full text-foreground border-border"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthModalOpen(true);
                      }}
                    >
                      Login
                    </Button>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthModalOpen(true);
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main>{children}</main>

      {/* Auth Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to Coloanex</DialogTitle>
            <DialogDescription> Choose your preferred sign-in method </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <button
              onClick={() => {
                setAuthModalOpen(false);
                navigate("/login");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Use Email & Password</span>
            </button>

            <button
              onClick={() => setAuthModalOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Use Email & OTP</span>
            </button>

            <button
              onClick={() => setAuthModalOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Use Phone & OTP</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground"> Or continue with </span>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>

            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="font-medium">Continue with Apple</span>
            </button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              By continuing, you agree to our{" "}
              <Link to="/" className="text-primary hover:underline cursor-pointer"> Terms of Service </Link> and acknowledge that you have read our{" "}
              <Link to="#" className="text-primary hover:underline cursor-pointer"> Privacy Policy </Link>
            </p>

            <p className="text-center text-sm mt-4">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setAuthModalOpen(false);
                  navigate("/signup");
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
                type="button"
              >
                Create Account
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {showFooter && (
        <footer className="bg-background border-t border-border text-foreground py-16 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Link to="/" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <img src="/images/logo.png" alt="C" className="w-full h-full" />
                    </div>
                  </Link>
                  <span className="text-xl font-bold">Coloanex</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  The future of collaborative lending. Secure, compliant, and
                  built for scale.
                </p>
                <div className="flex gap-4">
                  <Link
                    to="#"
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors border border-border"
                  >
                    <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </Link>
                  <Link
                    to="#"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </Link>
                  <Link
                    to="#"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </Link>
                </div>
              </div>

                <div className="col-span-1 md:col-span-3 grid grid-cols-3 gap-2 sm:gap-8">
                <div>
                  <h4 className="font-bold mb-4 text-foreground">Product</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <Link to="/#features" className="hover:text-primary transition-colors" onClick={() => handleNavClick("how-it-works")}>
                        How It Works
                      </Link>
                    </li>
                    <li>
                      <Link to="/#features" className="hover:text-primary transition-colors" onClick={() => handleNavClick("features")}>
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link to="/#use-cases" className="hover:text-primary transition-colors" onClick={() => handleNavClick("use-cases")}>
                        Use Cases
                      </Link>
                    </li>
                    <li>
                      <Link to="/#security" className="hover:text-primary transition-colors" onClick={() => handleNavClick("security")}>
                        Security
                      </Link>
                    </li>
                    <li>
                      <Link to="/#pricing" className="hover:text-primary transition-colors" onClick={() => handleNavClick("pricing")}>
                        Pricing
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-4 text-foreground">Company</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li> <Link to="#" className="hover:text-primary transition-colors"> About </Link> </li>
                    <li> <Link to="#" className="hover:text-primary transition-colors"> Blog </Link> </li>
                    <li> <Link to="#" className="hover:text-primary transition-colors"> Careers </Link> </li>
                    <li> <Link to="#" className="hover:text-primary transition-colors"> Contact </Link> </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-4 text-foreground">Legal</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li> <Link to="#" className="hover:text-primary transition-colors"> Privacy Policy </Link> </li>
                    <li> <Link to="#" className="hover:text-primary transition-colors"> Terms of Service </Link> </li>
                    <li> <Link to="#" className="hover:text-primary transition-colors"> Cookie Policy </Link> </li>
                    <li> <Link to="#" className="hover:text-primary transition-colors"> Compliance </Link> </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
              © 2024 Coloanex. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
