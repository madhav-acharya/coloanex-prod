import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Users,
  FileCheck,
  Activity,
  Building2,
  Lock,
  UserCheck,
  FolderLock,
  Menu,
  X,
  ArrowRight,
  Check,
  Layers,
  Eye,
  Fingerprint,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetEarlyAccess = () => {
    navigate("/login");
  };

  const handleBookDemo = () => {
    // For now, scroll to contact section or show a modal
    // In production, this could open a calendar booking widget
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    } else {
      // Fallback to early access for demo
      navigate("/login");
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const features = [
    {
      icon: Fingerprint,
      title: "KYC Engine",
      description:
        "Comprehensive identity verification with document validation, liveness checks, and regulatory compliance built-in.",
    },
    {
      icon: UserCheck,
      title: "Borrower Profiles",
      description:
        "Rich borrower identity profiles with verified credentials, credit history, and trust scores for informed decisions.",
    },
    {
      icon: Layers,
      title: "Multi-Tenant RBAC",
      description:
        "Institution-level tenants with granular role-based access control. Define permissions at every level.",
    },
    {
      icon: Activity,
      title: "Audit Logging",
      description:
        "Complete activity trails for every action. Track document uploads, status changes, and user interactions.",
    },
    {
      icon: FolderLock,
      title: "Secure Document Vault",
      description:
        "Encrypted storage for KYC documents, loan agreements, and sensitive files with access controls.",
    },
    {
      icon: Eye,
      title: "Real-Time Monitoring",
      description:
        "Live dashboards tracking loan status, borrower activity, and portfolio health across your organization.",
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description:
        "End-to-end encryption, SOC 2 compliance, and enterprise security standards.",
    },
    {
      icon: Users,
      title: "Collaborative Workflows",
      description:
        "Seamless borrower-lender communication with shared visibility and approvals.",
    },
    {
      icon: Building2,
      title: "Enterprise Ready",
      description:
        "Multi-tenant architecture scales from startups to large financial institutions.",
    },
    {
      icon: FileCheck,
      title: "Compliance First",
      description:
        "Built-in regulatory compliance for KYC/AML requirements across jurisdictions.",
    },
  ];

  const useCases = [
    {
      title: "P2P Lending Platforms",
      description:
        "Enable peer-to-peer lending with verified borrower profiles and secure document exchange.",
      icon: Users,
    },
    {
      title: "Microfinance Institutions",
      description:
        "Streamline loan origination with KYC automation and borrower management at scale.",
      icon: Building2,
    },
    {
      title: "Credit Unions",
      description:
        "Modernize member lending with collaborative workflows and audit-ready documentation.",
      icon: Lock,
    },
  ];

  const trustPoints = [
    "256-bit AES encryption at rest and in transit",
    "SOC 2 Type II certified infrastructure",
    "GDPR and CCPA compliant data handling",
    "99.9% uptime SLA guarantee",
    "Regular third-party security audits",
    "Role-based access with MFA enforcement",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Coloanex
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#use-cases"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Use Cases
              </a>
              <a
                href="#security"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </a>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={handleLogin}>
                Login
              </Button>
              <Button variant="hero" onClick={handleGetEarlyAccess}>
                Get Early Access
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border animate-fade-in">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block py-2 text-muted-foreground hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#use-cases"
                className="block py-2 text-muted-foreground hover:text-foreground"
              >
                Use Cases
              </a>
              <a
                href="#security"
                className="block py-2 text-muted-foreground hover:text-foreground"
              >
                Security
              </a>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={handleLogin}
                >
                  Login
                </Button>
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={handleGetEarlyAccess}
                >
                  Get Early Access
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Collaborative Loan Sharing Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Trust-First Lending,{" "}
              <span className="text-gradient">Built for Scale</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Coloanex enables secure borrower–lender collaboration with full
              KYC verification, role-based access control, and enterprise-grade
              audit logging. Build trust at every transaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" onClick={handleGetEarlyAccess}>
                Get Early Access
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="heroOutline" size="lg" onClick={handleBookDemo}>
                Book a Demo
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                SOC 2 Compliant
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                GDPR Ready
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                99.9% Uptime
              </div>
            </div>
          </div>

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
                      <div className="w-3 h-3 rounded-full bg-destructive/60" />
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
                          Rs.2.4Cr
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
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Choose Coloanex?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built from the ground up for modern lending operations with
              security and compliance at its core.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="bg-card border-0 shadow-card hover:shadow-soft transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Core Platform Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage collaborative lending with
              confidence and compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-soft transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section
        id="use-cases"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built for Your Industry
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Flexible architecture that adapts to diverse lending models and
              regulatory requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card
                key={index}
                className="bg-card border-0 shadow-card overflow-hidden group"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                    <useCase.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground">{useCase.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Enterprise-Grade Security
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Your data security is non-negotiable. Coloanex is built on a
                foundation of trust, with comprehensive security measures that
                meet the strictest financial industry standards.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {trustPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="bg-gradient-dark border-0 text-primary-foreground overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-8 h-8" />
                    <span className="text-xl font-semibold">
                      Security First
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
                      <div className="text-sm opacity-80 mb-1">Encryption</div>
                      <div className="font-semibold">AES-256 + TLS 1.3</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
                      <div className="text-sm opacity-80 mb-1">Compliance</div>
                      <div className="font-semibold">SOC 2, GDPR, CCPA</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
                      <div className="text-sm opacity-80 mb-1">
                        Infrastructure
                      </div>
                      <div className="font-semibold">
                        Multi-region, 99.9% SLA
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Lending Operations?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join forward-thinking institutions already using Coloanex to build
            trust, ensure compliance, and scale their collaborative lending.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" onClick={handleGetEarlyAccess}>
              Get Early Access
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="lg" onClick={handleBookDemo}>
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Coloanex</span>
              </div>
              <p className="text-background/70 text-sm">
                Collaborative loan sharing platform built on trust, security,
                and transparency.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li>
                  <a
                    href="#features"
                    className="hover:text-background transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#security"
                    className="hover:text-background transition-colors"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    API Docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-background/10 pt-8 text-center text-sm text-background/50">
            © 2024 Coloanex. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
