import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layouts/PublicLayout";
import { ArrowRight, CheckCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import UseCases from "./UseCases";
import Security from "./Security";
import Pricing from "./Pricing";

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Determine which section to scroll to based on path
    const path = location.pathname;
    let targetId = "";

    if (path === "/features") targetId = "features";
    else if (path === "/how-it-works") targetId = "how-it-works";
    else if (path === "/use-cases") targetId = "use-cases";
    else if (path === "/security") targetId = "security";
    else if (path === "/pricing") targetId = "pricing";

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        // Small timeout ensures component is rendered
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname]);

  const stats = [
    { value: "500+", label: "Lending Institutions" },
    { value: "50K+", label: "Active Borrowers" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "$2B+", label: "Loans Processed" },
  ];

  return (
    <PublicLayout showFooter={true}>
      <div className="bg-background text-foreground scroll-smooth">

        {/* Core */}
        <div id="home_container">
          <section id="home" className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 right-[5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-60" />
              <div className="absolute bottom-20 left-[5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] opacity-40" />
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 pb-20 grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="text-primary text-sm font-bold tracking-tight uppercase">Multi-Tenant Lending OS</span>
                </div>
                <h1 className="text-6xl md:text-7xl font-black text-foreground leading-[1.05] tracking-tight mb-8">
                  Modernize Your<br />
                  <span className="text-primary">Lending</span> Pipeline.
                </h1>
                <p className="text-muted-foreground text-xl mb-12 leading-relaxed font-medium">
                  Coloanex provides the infrastructure for banks and microfinance to manage the entire lifecycle — from digital onboarding to blockchain contracts.
                </p>
                <div className="flex flex-wrap gap-6">
                  <Button
                    size="lg"
                    className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105"
                    onClick={() => navigate("/signup")}
                  >
                    Get Started Free <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-10 text-lg rounded-full text-foreground border-border hover:bg-muted font-bold"
                    onClick={() => {
                      document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Our Services
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-8 mt-12">
                  {[
                    "Blockchain Verified",
                    "Instant Decisioning",
                    "White-Label Ready",
                  ].map((tag) => (
                    <div key={tag} className="flex items-center gap-2 text-foreground/70 text-sm font-bold">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      {tag}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative group lg:h-[600px] flex items-center justify-center">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120%] bg-primary/5 blur-[120px] rounded-full scale-110" />
                <img
                  src="/static/loan.png"
                  alt="Lending Dashboard"
                  className="relative w-full max-w-[650px] object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
            </div>
          </section>

          {/* New Services Section */}
          <section id="services" className="py-24 bg-background relative overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-20 max-w-3xl mx-auto">
                <Badge variant="outline" className="mb-4 py-1 px-4 border-primary/30 text-primary text-sm font-black uppercase tracking-widest">Our Core Offerings</Badge>
                <h2 className="text-4xl md:text-5xl font-black mb-6">Comprehensive High-Volume Services</h2>
                <p className="text-muted-foreground text-xl">We provide the specialized verticals required to operate a profitable lending business in any jurisdiction.</p>
              </div>

              <div className="space-y-40">
                {/* 1. Personal Loans */}
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                  <div className="relative group rounded-[3rem] overflow-hidden">
                    <img
                      src="/static/personal-loan.png"
                      alt="Personal Loans"
                      className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black mb-6">Personal Credit Lines</h3>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      Deploy flexible personal credit solutions with automated risk scoring. Our system integrates with regional credit bureaus to provide instant decisions for retail borrowers.
                    </p>
                    <ul className="space-y-4 mb-10">
                      {["Digital Onboarding & KYC", "Repayment Schedule Automation", "Interest Rate Policy Engine"].map((f) => (
                        <li key={f} className="flex items-center gap-3 text-lg font-bold">
                          <CheckCircle className="w-6 h-6 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="link" className="p-0 text-primary text-lg font-black group h-auto">
                      Explore Credit Solutions <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>

                {/* 2. Business Capital */}
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                  <div className="order-2 lg:order-1">
                    <h3 className="text-4xl font-black mb-6">Enterprise & SME Capital</h3>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      Scale your commercial lending with multi-signature approvals and collateral management. Perfect for manufacturing, retail expansion, and agricultural micro-credits.
                    </p>
                    <ul className="space-y-4 mb-10">
                      {["Collateral Asset Tracking", "Multi-Sig Approval Workflow", "Corporate Entity Verification"].map((f) => (
                        <li key={f} className="flex items-center gap-3 text-lg font-bold">
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="link" className="p-0 text-emerald-500 text-lg font-black group h-auto">
                      View Business Suite <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  <div className="order-1 lg:order-2 relative group rounded-[3rem] overflow-hidden">
                    <img
                      src="/static/business-loan.png"
                      alt="Business Capital"
                      className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>

                {/* 3. Asset-Backed (Auto) */}
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                  <div className="relative group rounded-[3rem] overflow-hidden">
                    <img
                      src="/static/auto-loan.png"
                      alt="Asset-Backed Loans"
                      className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black mb-6">Asset-Backed Financing</h3>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      Specialized modules for auto loans and equipment leasing. Track lien status and automate reminders for insurance and registration renewals.
                    </p>
                    <ul className="space-y-4 mb-10">
                      {["Smart Lien Management", "Insurance Compliance Tracking", "Flexible Lease-to-Own Terms"].map((f) => (
                        <li key={f} className="flex items-center gap-3 text-lg font-bold">
                          <CheckCircle className="w-6 h-6 text-accent" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="link" className="p-0 text-accent text-lg font-black group h-auto">
                      Review Asset Financing <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Summary */}
          <section className="py-20 bg-muted/30 border-y border-border/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="text-4xl md:text-5xl font-black text-primary mb-2">{s.value}</div>
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Embedded Sections */}
        <div id="how-it-works" className="-mt-8 pt-8">
          <HowItWorks />
        </div>

        <div id="features" className="-mt-8 pt-8">
          <Features />
        </div>

        <div id="use-cases" className="-mt-8 pt-8 relative">
          <UseCases />
        </div>

        <div id="security" className="-mt-8 pt-8">
          <Security />
        </div>

        <div id="pricing" className="-mt-8 pt-8">
          <Pricing />
        </div>

      </div>
    </PublicLayout>
  );
}
