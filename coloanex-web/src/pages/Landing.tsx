import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Award,
  Check,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-gradient font-bold text-xl">CoLoanEx</div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link to="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link to="/login">
                    <Button className="bg-gradient-hero">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-hero rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div
            className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-accent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-brand rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-slow"></div>
        </div>

        <div className="hero-content">
          <div className="animate-fade-up">
            <h1 className="hero-title">
              Revolutionary
              <span className="text-gradient"> Loan Exchange </span>
              Platform
            </h1>
            <p className="hero-subtitle">
              Transform your lending experience with our cutting-edge
              peer-to-peer loan exchange platform. Connect borrowers and lenders
              seamlessly with advanced security and transparent processes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-gradient-hero hover:shadow-glow transition-all duration-300 group"
                >
                  Start Lending
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/30 hover:bg-primary/10"
                >
                  Apply for Loan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Visual */}
      <div
        className="mt-16 relative animate-fade-up"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <Card className="shadow-card bg-gradient-card border border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-foreground/5 border-b border-border px-6 py-4 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Coloanex Dashboard
                </span>
              </div>
              <div className="p-6 grid md:grid-cols-3 gap-6">
                {/* Stats */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-background border border-border">
                    <div className="text-2xl font-bold text-foreground">
                      $2.4M
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Loans
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-background border border-border">
                    <div className="text-2xl font-bold text-foreground">
                      1,247
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Verified Borrowers
                    </div>
                  </div>
                </div>
                {/* Recent Activity */}
                <div className="md:col-span-2 p-4 rounded-xl bg-background border border-border">
                  <div className="text-sm font-medium text-foreground mb-3">
                    Recent Activity
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        action: "KYC Verified",
                        user: "Sarah M.",
                        time: "2m ago",
                        status: "success",
                      },
                      {
                        action: "Document Uploaded",
                        user: "James K.",
                        time: "5m ago",
                        status: "info",
                      },
                      {
                        action: "Loan Approved",
                        user: "Priya R.",
                        time: "12m ago",
                        status: "success",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              item.status === "success"
                                ? "bg-green-500"
                                : "bg-primary"
                            }`}
                          />
                          <span className="text-sm text-foreground">
                            {item.action}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            — {item.user}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Glow effects */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-primary/20 blur-3xl" />
      </div>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose CoLoanEx?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of lending with our innovative features
              designed for modern financial needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div
              className="feature-card animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="feature-icon">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Bank-Grade Security
              </h3>
              <p className="text-muted-foreground">
                Advanced encryption and security protocols protect your
                financial data and transactions at every step.
              </p>
            </div>

            <div
              className="feature-card animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="feature-icon">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Processing</h3>
              <p className="text-muted-foreground">
                Lightning-fast loan approvals and fund transfers with our
                automated smart matching system.
              </p>
            </div>

            <div
              className="feature-card animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="feature-icon">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Peer-to-Peer Network
              </h3>
              <p className="text-muted-foreground">
                Connect directly with verified lenders and borrowers for better
                rates and flexible terms.
              </p>
            </div>

            <div
              className="feature-card animate-fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="feature-icon">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Competitive Rates</h3>
              <p className="text-muted-foreground">
                Access competitive interest rates through our dynamic pricing
                algorithm and market competition.
              </p>
            </div>

            <div
              className="feature-card animate-fade-up"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="feature-icon">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Credit Building</h3>
              <p className="text-muted-foreground">
                Build and improve your credit score with responsible borrowing
                and lending activities.
              </p>
            </div>

            <div
              className="feature-card animate-fade-up"
              style={{ animationDelay: "0.6s" }}
            >
              <div className="feature-icon">
                <Check className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Transparent Process
              </h3>
              <p className="text-muted-foreground">
                Complete transparency in fees, rates, and terms with no hidden
                costs or surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-white">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">$50M+</div>
              <div className="text-blue-100">Loans Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">25K+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-card">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of satisfied users who have transformed their
            financial journey with CoLoanEx
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <Button
                size="lg"
                className="bg-gradient-hero hover:shadow-glow transition-all duration-300"
              >
                Create Account
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-gradient font-bold text-xl mb-4">
                CoLoanEx
              </div>
              <p className="text-sm text-muted-foreground">
                Revolutionizing the lending industry with innovative
                peer-to-peer loan exchange solutions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    For Borrowers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    For Lenders
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 CoLoanEx. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
