import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, HardDrive, Key, FileCheck, ArrowRight, Eye, KeyRound, Server } from "lucide-react";
import PublicLayout from "@/components/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };

export default function Security() {
  return (
    <div className="w-full">
      <div className="bg-background text-foreground pb-24 overflow-hidden">
        
        {/* Core Header */}
        <div className="relative pt-12 pb-20 text-center">
          <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-emerald-500/10 to-transparent -z-10" />
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-[1400px] mx-auto px-4">
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-8 py-1.5 px-6 text-sm bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase font-black tracking-widest">
                Mission Critical Defense
              </Badge>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h1 className="text-6xl md:text-8xl font-black mb-10 leading-none">
                Hardened <span className="text-emerald-500">Security</span>
              </h1>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto font-medium">
                No single point of failure. We combine microservice isolation, cryptographic guarantees on the blockchain, and rigorous continuous pentesting.
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 space-y-48 mt-20">
          
          {/* Section 1: Encryption */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div variants={fadeIn}>
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-10">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-5xl font-black mb-10">Encryption & Vaulting</h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                Your sensitive data is fragmented and encrypted using AES-256 for storage, while Multi-Party Computation (MPC) ensures that lending keys are never exposed in a single environment.
              </p>
              
              <Accordion type="single" collapsible className="w-full space-y-6">
                <AccordionItem value="item-1" className="border rounded-[2rem] px-8 py-2 bg-muted/30">
                  <AccordionTrigger className="text-2xl font-black hover:no-underline hover:text-emerald-500 transition-colors">Zero-Knowledge Storage</AccordionTrigger>
                  <AccordionContent className="text-xl text-muted-foreground leading-relaxed pt-4 pb-4">
                    We leverage ZK-proofs to verify user eligibility without ever storing persistent plaintext copies of identity documents in our centralized databases.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-[2rem] px-8 py-2 bg-muted/30">
                  <AccordionTrigger className="text-2xl font-black hover:no-underline hover:text-emerald-500 transition-colors">Hardware Security Modules</AccordionTrigger>
                  <AccordionContent className="text-xl text-muted-foreground leading-relaxed pt-4 pb-4">
                    Financial signing keys are protected within FIPS 140-2 Level 3 compliant hardware, ensuring absolute isolation from the application layer.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
            
            <motion.div variants={fadeIn} className="relative group">
              <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-[120px] scale-110 opacity-50" />
              <div className="relative rounded-[4rem] overflow-hidden">
                <img
                  src="/static/security_v3_white_bg_1776447306071.png"
                  alt="Security Infrastructure"
                  className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
                  style={{ maskImage: 'radial-gradient(circle, black 70%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle, black 70%, transparent 100%)' }}
                />
              </div>
            </motion.div>
          </motion.section>

          {/* Section 2: Immutability */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div variants={fadeIn} className="order-2 lg:order-1 relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-[120px] scale-110 opacity-50" />
              <div className="relative rounded-[4rem] overflow-hidden">
                <img
                  src="/static/smart-contract.png"
                  alt="On-Chain Immutability"
                  className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="order-1 lg:order-2">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-10">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-5xl font-black mb-10">Immutable Trust</h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                Every transaction and loan state transition is notarized on the blockchain. This creates a transparent, non-repudiable history for both lenders and borrowers.
              </p>
              
              <div className="space-y-12">
                {[
                  { icon: <Eye />, title: "Real-time Verification", desc: "Auditors can verify platform solvency and debt-to-equity ratios in real-time via public explorers." },
                  { icon: <Server />, title: "Contract Finality", desc: "Logic governing repayments is immutable once deployed, preventing arbitrary changes by any rogue actor." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-primary shrink-0">
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
          </motion.section>

        </div>

        {/* Global CTA */}
        <div className="max-w-[1400px] mx-auto px-4 mt-48">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="bg-emerald-600 p-16 md:p-24 rounded-[4rem] text-white flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-black mb-8 text-white leading-tight">
                Secure from Day One.<br />Guaranteed Forever.
              </h2>
              <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
                Our architecture exceeds ISO 27001 and SOC2 Type II standards. Your lending operations deserve nothing less.
              </p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center">
                <Button size="lg" className="h-[72px] px-14 text-xl bg-white text-emerald-600 hover:bg-white/90 rounded-full font-black shadow-2xl transition-transform hover:scale-105">
                  Read Technical Whitepaper
                </Button>
                <Button size="lg" variant="outline" className="h-[72px] px-14 text-xl border-white/30 text-white hover:bg-white/10 rounded-full font-black">
                  Security Deep Dive
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}