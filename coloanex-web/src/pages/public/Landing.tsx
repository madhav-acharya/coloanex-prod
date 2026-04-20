import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import PublicLayout from "@/components/layouts/PublicLayout";
import { ArrowRight, CheckCircle, Star, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import Security from "./Security";
import Pricing from "./Pricing";

interface LandingProps {
  isSubcomponent?: boolean;
}

export default function Landing({ isSubcomponent = false }: LandingProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isSubcomponent) return;

    const path = location.pathname;
    let targetId = "";

    if (path === "/features") targetId = "features";
    else if (path === "/how-it-works") targetId = "how-it-works";
    else if (path === "/security") targetId = "security";
    else if (path === "/pricing") targetId = "pricing";

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isSubcomponent, location.pathname]);

  const stats = [
    { value: "500+", label: "Lending Institutions" },
    { value: "12M+", label: "API Requests/Mo" },
    { value: "99.99%", label: "Uptime SLA" },
    { value: "$5B+", label: "Total Volume" },
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const content = (
    <div id="home" className="text-foreground scroll-smooth">
      {/* Hero Section */}
      <div id="home_container" className="relative z-10">
        <section
          id="home"
          className="relative min-h-[80vh] md:min-h-[90vh] flex items-center overflow-hidden"
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="container max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-8 md:gap-12 items-center relative z-10"
          >
            <div className="max-w-xl">
              <motion.div
                variants={fadeIn}
                className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-6 md:mb-8"
              >
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="text-primary text-[10px] md:text-xs font-bold tracking-widest uppercase">
                  Lending OS for Institutions
                </span>
              </motion.div>
              <motion.h1
                variants={fadeIn}
                className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] mb-6 md:mb-8"
              >
                The Protocol for
                <br />
                <span className="text-primary">Next-Gen</span> Lending.
              </motion.h1>
              <motion.p
                variants={fadeIn}
                className="text-muted-foreground text-base md:text-lg leading-relaxed font-medium mb-8 md:mb-10"
              >
                CoLoanEx provides the infrastructure for banks, fintechs, and
                microfinance to deploy autonomous lending workflows — from
                digital kyc to blockchain settlement.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-base bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold shadow-soft transition-all"
                  onClick={() => navigate("/signup")}
                >
                  Start Building{" "}
                  <ArrowRight className="ml-2 w-4 md:w-5 h-4 md:h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-base rounded-2xl text-foreground border-border hover:bg-muted font-bold"
                  onClick={() => {
                    document
                      .getElementById("infrastructure")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  View Infrastructure
                </Button>
              </motion.div>

              <motion.div
                variants={fadeIn}
                className="flex flex-wrap items-center gap-4 md:gap-6 mt-8 md:mt-12"
              >
                {["Multi-Tenant", "Smart Contracts", "SDK Integrated"].map(
                  (tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 text-foreground/60 text-[10px] md:text-xs font-bold uppercase tracking-wider"
                    >
                      <CheckCircle className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary" />
                      {tag}
                    </div>
                  ),
                )}
              </motion.div>
            </div>

            <motion.div
              variants={fadeIn}
              className="relative p-4 md:p-8 no-spotlight flex justify-center"
            >
              <img
                src="/static/loan.png"
                alt="Lending Platform"
                className="relative w-full max-w-[500px] md:max-w-[600px] object-contain organic-glow"
              />
            </motion.div>
          </motion.div>
        </section>
        {/* New Section: Unified Command (anyone.png) */}
        <div className="border-t border-border/10 w-full" />
        <section className="py-12 md:py-20 relative overflow-visible">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="container max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 md:gap-16 items-center relative z-10 overflow-visible"
          >
            <motion.div
              variants={fadeIn}
              className="order-2 lg:order-1 relative flex items-center justify-center p-4 md:p-8 no-spotlight"
            >
              <img
                src="/static/anyone.png"
                alt="Unified Dashboard"
                className="w-full h-auto max-w-[400px] md:max-w-[500px] object-contain relative z-10 organic-glow"
              />
            </motion.div>
            <motion.div variants={fadeIn} className="order-1 lg:order-2">
              <Badge
                variant="outline"
                className="mb-4 py-1.5 px-4 text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase font-black tracking-widest"
              >
                Command Center
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black mb-6 leading-tight uppercase tracking-widest">
                Unified <span className="text-primary">Dashboard</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed font-medium">
                Monitor your entire credit portfolio from a single pane of
                glass. Real-time analytics, borrower health scores, and
                automated alerting.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background/30">
                  <div className="text-primary font-black mb-1 text-xs md:text-sm">
                    REAL-TIME
                  </div>
                  <div className="text-[8px] md:text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">
                    Live data
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-background/30">
                  <div className="text-primary font-black mb-1 text-xs md:text-sm">
                    ALERTS
                  </div>
                  <div className="text-[8px] md:text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">
                    Risk detection
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>{" "}
        {/* Infrastructure Modules (Services) */}
        <section
          id="services"
          className="py-12 md:py-20 bg-background relative overflow-hidden border-t border-border/40"
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="container max-w-7xl mx-auto px-6 relative z-10"
          >
            <motion.div
              variants={fadeIn}
              className="text-center mb-12 md:mb-16 max-w-2xl mx-auto"
            >
              <Badge
                variant="outline"
                className="mb-4 py-1 px-3 border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
              >
                Core Infrastructure
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black mb-4">
                Modular Lending Modules
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Integrated vertical stacks for high-frequency institutional
                grade lending.
              </p>
            </motion.div>

            <div className="space-y-20 md:space-y-32">
              <motion.div
                variants={fadeIn}
                className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center overflow-visible"
              >
                <div className="relative flex items-center justify-center p-4 md:p-8 no-spotlight">
                  <img
                    src="/static/verify.png"
                    alt="Identity Infrastructure"
                    className="w-full h-auto max-w-[400px] md:max-w-[500px] object-contain relative z-10 organic-glow"
                  />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black mb-4">
                    Identity & KYC Engine
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
                    Deploy white-labeled KYC flows with regional identity
                    providers. Automate risk scoring and document verification.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Biometric Identity Verification",
                      "Automated AML/Sanctions Screening",
                      "Global Document Compliance",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 text-xs md:text-sm font-bold text-foreground/80"
                      >
                        <CheckCircle className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="link"
                    className="p-0 text-primary text-sm font-black group h-auto"
                    onClick={() => navigate("/how-it-works")}
                  >
                    View Integration Suite{" "}
                    <ArrowRight className="ml-2 w-3.5 md:w-4 h-3.5 md:h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>

              <motion.div
                variants={fadeIn}
                className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center"
              >
                <div className="order-2 lg:order-1">
                  <h3 className="text-lg md:text-xl font-black mb-3">
                    Blockchain Settlement
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4 leading-relaxed">
                    Secure distributed trust ledger. Smart contracts automate
                    interest, repayment triggers, and collateral liquidation.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {[
                      "Deterministic Interest Engines",
                      "Cross-Chain Asset Settlement",
                      "Immutable Audit Logging",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-foreground/80"
                      >
                        <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="link"
                    className="p-0 text-emerald-500 text-[11px] md:text-sm font-black group h-auto"
                    onClick={() => navigate("/security")}
                  >
                    View Protocol Details{" "}
                    <ArrowRight className="ml-1 w-3 md:w-3.5 h-3 md:h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
                <div className="order-1 lg:order-2 relative flex items-center justify-center p-4 md:p-8 no-spotlight">
                  <img
                    src="/static/contracts.png"
                    alt="Smart Ledger"
                    className="w-full h-auto max-w-[400px] md:max-w-[500px] object-contain relative z-10 organic-glow"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>
        {/* New Section: Deterministic Infrastructure (blocks.png) */}
        <section
          id="infrastructure"
          className="py-12 md:py-20 relative overflow-visible border-t border-border/10"
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="container max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 md:gap-16 items-center relative z-10 overflow-visible"
          >
            <motion.div variants={fadeIn}>
              <Badge
                variant="outline"
                className="mb-4 py-1.5 px-4 text-[10px] bg-primary/10 text-primary border-primary/20 uppercase font-black tracking-widest"
              >
                Base Layer
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black mb-6 leading-tight uppercase tracking-widest">
                Hardened <span className="text-primary">Architecture</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed font-medium">
                The CoLoanEx protocol is built on a distributed ledger that
                ensures 100% auditability and zero single points of failure.
                Modular, scalable, and secure.
              </p>
              <Button
                variant="outline"
                className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-10 md:h-11 px-5 md:px-6 border-border/10"
                onClick={() => navigate("/security")}
              >
                Security Framework
              </Button>
            </motion.div>
            <motion.div
              variants={fadeIn}
              className="relative flex items-center justify-center p-4 md:p-8 no-spotlight"
            >
              <img
                src="/static/blocks.png"
                alt="Deterministic Infrastructure"
                className="w-full h-auto max-w-[400px] md:max-w-[500px] object-contain relative z-10 organic-glow"
              />
            </motion.div>
          </motion.div>
        </section>
        {/* Platform Performance Stats */}
        <section className="py-12 md:py-16 bg-muted/5 border-y border-border/10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="container max-w-7xl mx-auto px-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((s) => (
                <motion.div variants={fadeIn} key={s.label}>
                  <div className="text-2xl md:text-3xl font-black text-primary mb-2">
                    {s.value}
                  </div>
                  <div className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>

      {/* Modular Sections */}
      <div id="how-it-works">
        <HowItWorks isSubcomponent={true} />
      </div>

      <div id="features">
        <Features isSubcomponent={true} />
      </div>

      {/* Section 4: Global Ecosystem (using person.png) */}
      <div className="border-t border-border/10 w-full" />
      <section className="py-12 md:py-24 relative overflow-visible">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="max-w-7xl mx-auto px-6 relative z-10 overflow-visible"
        >
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center overflow-visible">
            <motion.div variants={fadeIn}>
              <Badge
                variant="outline"
                className="mb-4 py-1.5 px-4 text-[10px] bg-primary/10 text-primary border-primary/20 uppercase font-black tracking-widest"
              >
                Network Coverage
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black mb-6 leading-tight uppercase tracking-widest">
                Global <span className="text-primary">Ecosystem</span>
              </h2>
              <motion.p
                variants={fadeIn}
                className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed font-medium"
              >
                Connect with a worldwide network of institutional lenders,
                credit bureaus, and regional partners. Our platform bridges the
                gap between local lending and global capital.
              </motion.p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                {["Bank Grade", "KYC Verified", "Multi-Region"].map((tag) => (
                  <motion.div
                    variants={fadeIn}
                    key={tag}
                    className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-surface/50 text-[9px] md:text-[10px] font-black uppercase tracking-widest"
                  >
                    {tag}
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              variants={fadeIn}
              className="relative flex items-center justify-center p-4 md:p-8 no-spotlight"
            >
              <img
                src="/static/person.png"
                alt="Global Ecosystem"
                className="w-full h-auto max-w-[350px] md:max-w-[450px] object-contain relative z-10 organic-glow"
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <div id="security" className="pt-12 md:pt-20 border-t border-border/10">
        <Security isSubcomponent />
      </div>

      <div id="pricing" className="pt-12 md:pt-20 border-t border-border/10">
        <Pricing isSubcomponent />
      </div>
    </div>
  );

  if (isSubcomponent) return content;

  return <PublicLayout showFooter={true}>{content}</PublicLayout>;
}
