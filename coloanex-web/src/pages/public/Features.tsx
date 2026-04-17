import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Workflow,
  Layers,
  ShieldCheck,
  Globe,
  Smartphone,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

export default function Features() {
  return (
    <div className="w-full">
      <div className="bg-background text-foreground pb-24 overflow-hidden">
        
        {/* Header */}
        <div className="relative pt-12 pb-20 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-[1400px] mx-auto px-4"
          >
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/30 text-primary uppercase font-black tracking-widest">The Feature Suite</Badge>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-none">
                Infrastructure to <span className="text-primary">Scale</span>
              </h2>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto font-medium">
                Coloanex was engineered for massive volume. Real-time synchronicity, mathematical trust, and professional-grade analytics.
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 space-y-48 mt-12 mb-24">
          
          {/* 1. Web Management */}
          <motion.section 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={stagger} 
            className="grid lg:grid-cols-2 gap-24 items-center"
          >
            <motion.div variants={fadeIn}>
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-10">
                <Workflow className="w-10 h-10" />
              </div>
              <h2 className="text-5xl font-black mb-10">Institutional Command Center</h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                Administrate your entire lending pipeline from a unified dashboard. Customize interest policies, regional rules, and approval hierarchies with absolute control.
              </p>

              <div className="grid sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-primary mb-4">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black">Multi-Tier Approval</h4>
                  <p className="text-lg text-muted-foreground leading-relaxed">Cryptographic multi-sig authorization to prevent unauthorized rule changes.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-primary mb-4">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black">Real-Time Data</h4>
                  <p className="text-lg text-muted-foreground leading-relaxed">Live streaming updates as borrowers apply or make payments across regions.</p>
                </div>
              </div>
            </motion.div>

             <motion.div variants={fadeIn} className="relative group">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120%] bg-primary/5 blur-[120px] rounded-full scale-110 opacity-60" />
                <div className="relative rounded-[3rem] overflow-hidden">
                 <img
                     src="/static/loan.png"
                     alt="Management Dashboard"
                     className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                 />
                </div>
             </motion.div>
          </motion.section>

          {/* 2. Borrower App */}
          <motion.section 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={stagger} 
            className="grid lg:grid-cols-2 gap-24 items-center"
          >
            <motion.div variants={fadeIn} className="lg:order-2">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-10">
                <Smartphone className="w-10 h-10" />
              </div>
              <h2 className="text-5xl font-black mb-10">Zero Friction Onboarding</h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                Empower your borrowers with a premium mobile experience. Instant applications, transparent tracking, and biometrically secured repayments.
              </p>

              <div className="grid sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-emerald-500 mb-4">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black">Native Native</h4>
                  <p className="text-lg text-muted-foreground leading-relaxed">High-performance compiled UI for a buttery smooth 120Hz borrower experience.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-emerald-500 mb-4">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black">Smart Lifecycle</h4>
                  <p className="text-lg text-muted-foreground leading-relaxed">Intelligent push notifications ensure borrowers stay ahead of their schedules.</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="lg:order-1 relative group">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120%] bg-emerald-500/5 blur-[120px] rounded-full scale-110 opacity-60" />
                <div className="w-[300px] h-[620px] bg-card shadow-2xl rounded-[3.5rem] border-[12px] border-foreground/10 p-8 flex flex-col relative z-10 mx-auto overflow-hidden">
                    <div className="w-28 h-6 bg-foreground/10 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-3xl"></div>
                    <div className="mt-16 space-y-8">
                        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <h4 className="text-3xl font-black">Loan Active</h4>
                        <div className="space-y-4">
                            <div className="h-4 bg-muted rounded-full w-full"></div>
                            <div className="h-4 bg-muted rounded-full w-2/3"></div>
                        </div>
                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-[2rem]">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Progression</p>
                            <p className="text-3xl font-black">88%</p>
                            <div className="w-full h-3 bg-muted rounded-full mt-6 overflow-hidden">
                                <div className="w-[88%] h-full bg-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
          </motion.section>

          {/* 3. Security Engine */}
          <motion.section 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={stagger} 
            className="grid lg:grid-cols-2 gap-24 items-center"
          >
            <motion.div variants={fadeIn}>
              <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center text-accent mb-10">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-5xl font-black mb-10">Hardened Infrastructure</h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                Security isn't an afterthought. Every transaction and rule set is encrypted and mirrored across our distributed trust ledger.
              </p>

              <div className="space-y-10">
                {[
                  { icon: <ShieldCheck />, title: "Quantum-Safe Encryption", desc: "Military-grade AES-256 and TLS 1.3 secured data movement across all layers." },
                  { icon: <Globe />, title: "Distributed Auditing", desc: "Automated reconciliation between standard databases and blockchain finality logs." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-8">
                    <div className="w-16 h-16 shrink-0 rounded-[1.5rem] bg-muted/50 flex items-center justify-center text-accent">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black mb-2">{item.title}</h4>
                      <p className="text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="relative group">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120%] bg-accent/5 blur-[120px] rounded-full scale-110 opacity-60" />
              <div className="relative rounded-[4rem] overflow-hidden">
                <img
                  src="/static/security_v3_white_bg_1776447306071.png"
                  alt="Security Architecture"
                  className="relative w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-[1.03]"
                  style={{ maskImage: 'radial-gradient(circle, black 70%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle, black 70%, transparent 100%)' }}
                />
              </div>
            </motion.div>
          </motion.section>

        </div>

        {/* Wide CTA */}
        <div className="max-w-[1400px] mx-auto px-4 mt-40">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="bg-muted/30 p-16 md:p-24 rounded-[4rem] border border-border flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-5xl font-black mb-6 leading-tight">
                Integrate via SDK or REST API
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Whether you prefer our React Native UI components or direct server-to-server interaction, Coloanex adapts to your existing tech stack effortlessly.
              </p>
            </div>
            <Button
              size="lg"
              className="h-20 px-12 text-xl rounded-full bg-foreground text-background font-black shadow-2xl hover:opacity-90 transition-transform hover:scale-105 shrink-0"
            >
              Start Integration
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
