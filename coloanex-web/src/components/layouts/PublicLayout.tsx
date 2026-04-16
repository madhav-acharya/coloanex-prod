import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";

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
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      {showHeader && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-dark backdrop-blur-xl border-b border-border">
          <div className="max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-8rem)] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <img
                    src="/images/logo.png"
                    alt="C"
                    className="w-full h-full"
                  />
                </div>
                <span className="font-bold text-white text-lg">Coloanex</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-8">
                <Link
                  to="/"
                  className={`cursor-pointer transition-colors ${
                    location.pathname === "/"
                      ? "text-primary font-bold"
                      : "text-white hover:text-foreground"
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/how-it-works"
                  className={`cursor-pointer transition-colors ${
                    location.pathname === "/how-it-works"
                      ? "text-primary font-bold"
                      : "text-white hover:text-foreground"
                  }`}
                >
                  How It Works
                </Link>
                <Link
                  to="/features"
                  className={`cursor-pointer transition-colors ${
                    location.pathname === "/features"
                      ? "text-primary font-bold"
                      : "text-white hover:text-foreground"
                  }`}
                >
                  Features
                </Link>
                <Link
                  to="/use-cases"
                  className={`cursor-pointer transition-colors ${
                    location.pathname === "/use-cases"
                      ? "text-primary font-bold"
                      : "text-white hover:text-foreground"
                  }`}
                >
                  Use Cases
                </Link>
                <Link
                  to="/security"
                  className={`cursor-pointer transition-colors ${
                    location.pathname === "/security"
                      ? "text-primary font-bold"
                      : "text-white hover:text-foreground"
                  }`}
                >
                  Security
                </Link>
                <Link
                  to="/pricing"
                  className={`cursor-pointer transition-colors ${
                    location.pathname === "/pricing"
                      ? "text-primary font-bold"
                      : "text-white hover:text-foreground"
                  }`}
                >
                  Pricing
                </Link>
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden lg:flex items-center gap-3 text-white">
                <ThemeSwitcher />
                {user ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="ghost">Dashboard</Button>
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
                    <Link to="/login">
                      <Button variant="ghost">Login</Button>
                    </Link>
                    <Link to="/signup">
                      <Button
                        variant="outline"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                      >
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 text-white hover:text-primary cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Sidebar Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar Content */}
          <div className="relative w-[90%] sm:w-[85%] max-w-sm h-full bg-gradient-dark border-r border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <img
                    src="/images/logo.png"
                    alt="C"
                    className="w-full h-full"
                  />
                </div>
                <span className="font-bold text-white text-lg">Coloanex</span>
              </div>
              <button
                className="p-2 text-white/80 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Links */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-sm font-semibold text-white/70">
                  Theme Selection
                </span>
                <ThemeSwitcher />
              </div>

              <div className="space-y-4">
                <Link
                  to="/"
                  className={`cursor-pointer block py-2 ${
                    location.pathname === "/"
                      ? "text-primary font-bold"
                      : "text-white/80 hover:text-white transition-colors"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/how-it-works"
                  className={`cursor-pointer block py-2 ${
                    location.pathname === "/how-it-works"
                      ? "text-primary font-bold"
                      : "text-white/80 hover:text-white transition-colors"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  to="/features"
                  className={`cursor-pointer block py-2 ${
                    location.pathname === "/features"
                      ? "text-primary font-bold"
                      : "text-white/80 hover:text-white transition-colors"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/use-cases"
                  className={`cursor-pointer block py-2 ${
                    location.pathname === "/use-cases"
                      ? "text-primary font-bold"
                      : "text-white/80 hover:text-white transition-colors"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Use Cases
                </Link>
                <Link
                  to="/security"
                  className={`cursor-pointer block py-2 ${
                    location.pathname === "/security"
                      ? "text-primary font-bold"
                      : "text-white/80 hover:text-white transition-colors"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Security
                </Link>
                <Link
                  to="/pricing"
                  className={`cursor-pointer block py-2 ${
                    location.pathname === "/pricing"
                      ? "text-primary font-bold"
                      : "text-white/80 hover:text-white transition-colors"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-white/10 mt-auto">
                {user ? (
                  <>
                    <Link to="/dashboard" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full text-foreground"
                      >
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/logout" className="w-full">
                      <Button className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground border border-destructive">
                        Logout
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full text-foreground"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup" className="w-full">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={showHeader ? "pt-14" : ""}>{children}</main>

      {/* Footer */}
      {showFooter && (
        <footer className="bg-gradient-dark text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Link
                    to="/"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <img
                        src="/images/logo.png"
                        alt="C"
                        className="w-full h-full"
                      />
                    </div>
                  </Link>
                  <span className="text-xl font-bold">Coloanex</span>
                </div>
                <p className="text-sm text-white/70 mb-4">
                  The future of collaborative lending. Secure, compliant, and
                  built for scale.
                </p>
                <div className="flex gap-4">
                  <Link
                    to="#"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </Link>
                  <Link
                    to="#"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </Link>
                  <Link
                    to="#"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="col-span-1 md:col-span-3 grid grid-cols-3 gap-2 sm:gap-8">
                <div>
                  <h4 className="font-bold mb-4 text-white">Product</h4>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li>
                      <Link
                        to="/features"
                        className="hover:text-white transition-colors"
                      >
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/use-cases"
                        className="hover:text-white transition-colors"
                      >
                        Use Cases
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/security"
                        className="hover:text-white transition-colors"
                      >
                        Security
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/pricing"
                        className="hover:text-white transition-colors"
                      >
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="hover:text-white transition-colors"
                      >
                        API Docs
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-4 text-white">Company</h4>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li>
                      <Link
                        to="#"
                        className="hover:text-white transition-colors"
                      >
                        About
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="hover:text-white transition-colors"
                      >
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="hover:text-white transition-colors"
                      >
                        Careers
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="hover:text-white transition-colors"
                      >
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-4 text-white">Legal</h4>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li>
                      <Link
                        to="#"
                        className="hover:text-white transition-colors"
                      >
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="hover:text-white transition-colors"
                      >
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="hover:text-white transition-colors"
                      >
                        Cookie Policy
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="hover:text-white transition-colors"
                      >
                        Compliance
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 text-center text-sm text-white/50">
              © 2024 Coloanex. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
