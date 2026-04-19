import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BorrowerLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function BorrowerLayout({ 
  children, 
  title, 
  description,
  className
}: BorrowerLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", path: "/borrower/dashboard" },
    { name: "Lenders", path: "/borrower/lenders" },
    { name: "Loans", path: "/borrower/my-loans" },
    { name: "Pricing", path: "/pricing" },
  ];

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute top-[10%] left-[15%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 rounded-full blur-[100px] opacity-30" 
        />
        <div 
          className="absolute bottom-[20%] right-[10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-emerald-500/5 rounded-full blur-[120px] opacity-40" 
        />
      </div>

      <nav
        className={`fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-md border-b border-border/10 transition-colors duration-300 ${scrolled ? "shadow-sm" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Standardized Logo */}
            <Link to="/borrower/dashboard" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/images/logo.png" alt="Coloanex" className="w-full h-full" />
              </div>
              <span className="font-bold text-foreground text-lg tracking-tight">Coloanex</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`cursor-pointer transition-colors text-sm font-medium ${
                    location.pathname === item.path
                      ? "text-primary font-bold border-b-2 border-primary pb-1"
                      : "text-foreground/80 hover:text-foreground pb-1"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <ThemeSwitcher />
                <NotificationsDropdown />
              </div>
              <div className="h-6 w-px bg-border/20 mx-2 hidden sm:block" />
              <ProfileDropdown />
              
              <button
                className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl shadow-2xl border-b border-border/10 px-6 py-8 space-y-6"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block py-3 px-2 transition-colors rounded-lg ${
                  location.pathname === item.path ? "text-primary font-bold bg-primary/5" : "text-foreground/80 hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-6 border-t border-border/10 flex items-center justify-between px-3">
              <span className="text-sm font-medium text-foreground/70">Theme & Settings</span>
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
                <NotificationsDropdown />
              </div>
            </div>
          </motion.div>
        )}
        {/* Animated Blinking Separator Line */}
        <div className="header-separator" />
      </nav>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Main Content */}
        <main className={cn("relative z-10 flex-1 pt-24 pb-20 md:pt-32 md:pb-32", className)}>
        <div className="max-w-7xl mx-auto px-6">
          {(title || description) && (
            <div className="mb-12 md:mb-20 space-y-4">
              {title && (
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-widest leading-none">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-medium leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/5 py-12 md:py-20 bg-surface/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1 space-y-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <img src="/images/logo.png" alt="CoLoanEx" className="w-5 h-5" />
                </div>
                <span className="font-black text-lg tracking-tighter uppercase sm:flex hidden">CoLoanEx</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Decentralized lending infrastructure for institutional scale.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-foreground">Platform</h4>
              <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <li><Link to="/borrower/lenders" className="hover:text-primary transition-colors">Find Lenders</Link></li>
                <li><Link to="/borrower/my-loans" className="hover:text-primary transition-colors">Active Loans</Link></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-foreground">Support</h4>
              <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <li><Link to="/security" className="hover:text-primary transition-colors">Security</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">API Keys</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-foreground">Connect</h4>
              <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Telegram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-border/5 gap-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              © 2024 CoLoanEx Protocol. All rights reserved.
            </span>
            <div className="flex items-center gap-8">
              <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary">Privacy</Link>
              <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
