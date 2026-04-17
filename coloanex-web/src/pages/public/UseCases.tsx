import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Factory, GraduationCap, Stethoscope, ShoppingBag, ArrowRight, Globe, CheckCircle2 } from "lucide-react";
import PublicLayout from "@/components/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };

export default function UseCases() {
  const cases = [
    {
      title: "Manufacturing Supply Chains",
      desc: "Provide liquidity to suppliers instantly. Prevent production halts with on-the-spot factoring, automatically tracked on-chain for undeniable audit trails.",
      icon: <Factory className="w-12 h-12 mb-6" />,
      color: "text-primary"
    },
    {
      title: "Educational Grants",
      desc: "Universities and independent lenders can offer structured, stage-based loans to students that only disburse when passing specific academic milestones.",
      icon: <GraduationCap className="w-12 h-12 mb-6" />,
      color: "text-emerald-500"
    },
    {
      title: "Medical Equipment Leasing",
      desc: "High-value machines can be financed seamlessly by private clinics. Multi-signature checks ensure equipment is verified before funds move.",
      icon: <Stethoscope className="w-12 h-12 mb-6" />,
      color: "text-accent"
    },
    {
      title: "Retail Expansion Capital",
      desc: "Micro-loans to brick and mortar shops based on real-time integrated sales data. Adjust lending policies dynamically in the web tenant.",
      icon: <ShoppingBag className="w-12 h-12 mb-6" />,
      color: "text-purple-500"
    },
    {
      title: "Agricultural Micro-credits",
      desc: "Empower farmers with seasonal credit for seeds and fertilizer. Repayment schedules can be tied to harvest cycles and market prices.",
      icon: <Globe className="w-12 h-12 mb-6" />,
      color: "text-emerald-600"
    }
  ];

  return (
    <div className="w-full">
      <div className="bg-background text-foreground pb-24 overflow-hidden">

        {/* Header */}
        <div className="relative pt-12 pb-20 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-[1400px] mx-auto px-4">
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/30 text-primary uppercase font-black tracking-widest">Industry Verticals</Badge>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-none">
                Unlimited <span className="text-primary">Use Cases</span>
              </h2>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto font-medium">
                Coloanex isn't just for traditional microfinance. Our isolated tenant architecture allows any enterprise to become a specialized lending facility.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Main Cases Grid */}
        <div className="max-w-[1400px] mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {cases.map((useCase, idx) => (
              <motion.div key={idx} variants={fadeIn} className="group p-10 rounded-[3rem] hover:bg-muted/50 transition-all">
                <div className={`${useCase.color}`}>
                  {useCase.icon}
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tight">{useCase.title}</h3>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">{useCase.desc}</p>
                <Button variant="link" className="p-0 text-foreground font-black group-hover:text-primary transition-colors text-lg font-black h-auto">
                  Explore Implementation <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom Detailed Section */}
        <div className="max-w-[1400px] mx-auto px-4 mt-48">
          <div className="grid lg:grid-cols-2 gap-24 items-center">

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="space-y-12"
            >
              <motion.div variants={fadeIn}>
                <h2 className="text-5xl font-black mb-8 leading-tight">Optimized for Scaling Any Model</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Our infrastructure is agnostic to lending environments, dynamically routing KYC verifications, risk analysis, and smart-contract execution according to each tenant’s specified parameters.
                </p>
              </motion.div>

              <div className="space-y-12">
                {[
                  { title: "Enterprise Consortia", desc: "Pool liquidity across multiple legal entities and automate loan allocations through round-robin or proportionate fractional algorithms." },
                  { title: "P2P Marketplaces", desc: "Run fully fledged matching engines. Borrowers submit requests; retail lenders supply partial or complete funds with escrow management." },
                  { title: "Microfinance Foundations", desc: "Empower field-agents with specialized mobile capabilities while head-office maintains complete macroeconomic analytics." }
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeIn} className="flex gap-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 mt-1">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black mb-2">{item.title}</h4>
                      <p className="text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="relative group p-12 lg:p-0"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-[120px] scale-110 opacity-50" />
              <div className="relative rounded-[4rem] overflow-hidden">
                <img
                  src="/static/use_cases_v3_white_bg_1776447287341.png"
                  alt="Use Cases Overview"
                  className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
                  style={{ maskImage: 'radial-gradient(circle, black 70%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle, black 70%, transparent 100%)' }}
                />
              </div>
            </motion.div>

          </div>
        </div>

        {/* Global CTA */}
        <div className="max-w-[1400px] mx-auto px-4 mt-48">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="bg-primary p-16 md:p-24 rounded-[4rem] text-primary-foreground flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 max-w-2xl text-center lg:text-left">
              <h2 className="text-5xl font-black mb-8 text-white leading-tight">
                Ready to Define Your Own Lending Rules?
              </h2>
              <p className="text-xl text-white/80 leading-relaxed font-medium">
                Don’t see your exact use case? Our Tenant Rules Engine is Turing-complete for conditional logic. Build your future today.
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <Button size="lg" className="h-20 px-14 text-xl bg-white text-primary hover:bg-white/90 rounded-full font-black shadow-2xl transition-transform hover:scale-105">
                Start Technical Trial
              </Button>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}