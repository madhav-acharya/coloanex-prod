import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, MousePointerClick, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };

export default function HowItWorks() {
  return (
    <div className="w-full">
      <div className="bg-background text-foreground pb-24 overflow-hidden">
        
        {/* Header */}
        <div className="relative pt-12 pb-20 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-[1400px] mx-auto px-4">
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/30 text-primary uppercase font-black tracking-widest">The Workflow</Badge>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-none">
                Seamless <span className="text-primary">Lending</span> Operations
              </h2>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto font-medium">
                From institutional onboarding to automated debt collection, CoLoanEx orchestrates every step with cryptographic certainty.
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 space-y-48">
          
          {/* Phase 1 */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div variants={fadeIn}>
              <Badge className="bg-primary/10 text-primary mb-8 px-4 py-1 text-sm font-black uppercase tracking-widest border-primary/20">Phase 1</Badge>
              <h2 className="text-5xl font-black mb-10 leading-tight">Institutional Tenant Activation</h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed font-medium">
                Set up your isolated lending environment in minutes. Configure your own interest models, risk thresholds, and compliance modules without sharing data with other lenders.
              </p>
              
              <div className="space-y-10">
                {[
                  { icon: <ShieldCheck />, title: "Isolated Data Vaults", desc: "Every tenant operates in a cryptographically siloed environment, ensuring your proprietary risk models remain yours." },
                  { icon: <MousePointerClick />, title: "One-Click Deployment", desc: "Push your lending parameters to the blockchain instantly with our pre-audited smart contract templates." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black mb-2">{item.title}</h4>
                      <p className="text-lg text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div variants={fadeIn} className="relative group p-12 lg:p-0">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-[120px] scale-110 opacity-50" />
              <div className="relative rounded-[4rem] overflow-hidden p-16">
                <img
                  src="/static/how_it_works_illustration_transparent_1776446406016.png"
                  alt="Institutional Dashboard"
                  className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
                  style={{ maskImage: 'radial-gradient(circle, black 70%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle, black 70%, transparent 100%)' }}
                />
              </div>
            </motion.div>
          </motion.section>

          {/* Phase 2 */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div variants={fadeIn} className="order-2 lg:order-1 relative group p-12 lg:p-0">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[500px] bg-primary/5 rounded-full blur-[150px] opacity-60" />
              <div className="relative rounded-[4rem] overflow-hidden p-16">
                <img
                  src="/static/media__1776445739234.png"
                  alt="Digital KYC Process"
                  className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
                  style={{ maskImage: 'radial-gradient(circle, black 70%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle, black 70%, transparent 100%)' }}
                />
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="order-1 lg:order-2">
              <Badge className="bg-primary/10 text-primary mb-8 px-4 py-1 text-sm font-black uppercase tracking-widest border-primary/20">Phase 2</Badge>
              <h2 className="text-5xl font-black mb-10 leading-tight">Digital KYC & Risk Score</h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed font-medium">
                Our AI-driven onboarder validates identity documents and calculates real-time risk scores by integrating with various financial data providers.
              </p>
              
              <div className="space-y-10">
                {[
                  { icon: <Zap />, title: "Instant Verifications", desc: "Check identities across 190+ countries in seconds using our global OCR and biometrics engine." },
                  { icon: <CheckCircle2 />, title: "Automated Approval", desc: "Loans meeting your preset criteria are automatically approved, significantly reducing operational overhead." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black mb-2">{item.title}</h4>
                      <p className="text-lg text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.section>

        </div>

        {/* Closing CTA */}
        <div className="max-w-[1400px] mx-auto px-4 mt-48">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="bg-primary p-24 rounded-[4rem] text-primary-foreground flex flex-col items-center text-center relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black mb-8 text-white leading-tight">
                Want to See the Platform in Action?
              </h2>
              <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
                Experience the transparency of blockchain-backed lending. Speak with our infrastructure experts today.
              </p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center">
                <Button size="lg" className="h-[72px] px-14 text-xl bg-white text-primary hover:bg-white/90 rounded-full font-black shadow-2xl transition-transform hover:scale-105">
                  Book Architecture Demo
                </Button>
                <Button size="lg" variant="outline" className="h-[72px] px-14 text-xl border-white/30 text-white hover:bg-white/10 rounded-full font-black">
                  Developer Resources
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
