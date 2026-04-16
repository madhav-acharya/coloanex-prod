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
    <PublicLayout>
      <div className="bg-background text-foreground transition-colors duration-300 pb-20">
        
        {/* Core Hero */}
        <div className="relative pt-32 pb-24 flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-background to-background dark:from-emerald-500/20 -z-10" />
          <motion.div initial="hidden" animate="visible" variants={stagger} className="container mx-auto px-4 max-w-5xl">
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-6 py-1.5 px-6 text-sm bg-primary/10 text-primary border-primary/20 shadow-glow">
                Bank-Grade Defenses
              </Badge>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter mb-8 text-foreground leading-[1.1]">
                Uncompromising <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">Security Layers</span>
              </h1>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
                No single point of failure. We combine microservice isolation, cryptographic guarantees on the blockchain, and rigorous continuous pentesting.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Security Deep Dives */}
        <div className="container mx-auto px-4 max-w-6xl space-y-32 mt-12">
          
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeIn}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 text-primary mb-6 shadow-glow">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Encryption & Vaulting</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Your sensitive data is fragmented and encrypted using AES-256 for storage, while Multi-Party Computation (MPC) ensures that lending keys are never exposed in a single environment.
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary hover:no-underline">Zero-Knowledge Storage</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    We leverage ZK-proofs to verify user eligibility without ever storing persistent plaintext copies of identity documents in our centralized databases.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary hover:no-underline">Hardware Security Modules (HSM)</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Financial signing keys are protected within FIPS 140-2 Level 3 compliant hardware, ensuring absolute isolation from the application layer.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
            
            <motion.div variants={fadeIn} className="relative flex justify-center">
              <div className="relative rounded-3xl w-full max-w-md aspect-square bg-gradient-to-br from-background to-primary/5 border border-border flex items-center justify-center p-8 shadow-2xl">
                 <div className="absolute inset-4 border border-dashed border-primary/20 rounded-2xl"></div>
                 <div className="absolute inset-8 border border-dashed border-primary/40 rounded-xl"></div>
                 <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="w-32 h-32 bg-card rounded-2xl shadow-2xl flex items-center justify-center border border-primary/50 z-10">
                    <KeyRound className="w-16 h-16 text-primary" />
                 </motion.div>
              </div>
            </motion.div>
          </motion.section>

          <Separator className="my-12 opacity-50" />

          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid md:grid-cols-2 gap-16 items-center md:flex-row-reverse">
             <motion.div variants={fadeIn}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 text-accent mb-6 shadow-glow">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Immutable Audits</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Every transaction and loan state transition is notarized on the blockchain. This creates a transparent, non-repudiable history for both lenders and borrowers.
              </p>
              <div className="grid gap-6">
                 <div className="flex gap-4">
                    <Eye className="w-8 h-8 text-accent shrink-0" />
                    <div><h4 className="font-bold text-lg">Real-time Verification</h4><p className="text-muted-foreground mt-1 text-sm">Auditors can verify the platform's solvency and debt-to-equity ratios in real-time via public explorer links.</p></div>
                 </div>
                 <div className="flex gap-4">
                    <Server className="w-8 h-8 text-accent shrink-0" />
                    <div><h4 className="font-bold text-lg">Smart Contract Guarantees</h4><p className="text-muted-foreground mt-1 text-sm">Logic governing repayments and interest is immutable once deployed, preventing arbitrary changes by any party.</p></div>
                 </div>
              </div>
            </motion.div>
            
            <motion.div variants={fadeIn} className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] bg-gradient-to-tr from-teal-500/10 to-transparent border border-border flex items-center justify-center p-8">
                 <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="w-full flex flex-col gap-4">
                    <div className="w-full bg-card border-l-4 border-teal-500 p-4 rounded-r-xl shadow-lg flex justify-between items-center"><span className="text-sm font-semibold text-foreground">Block #14920</span><div className="font-mono text-xs text-teal-500">0x8a7...3f2</div></div>
                    <div className="w-full bg-card border-l-4 border-teal-500 p-4 rounded-r-xl shadow-lg flex justify-between items-center ml-4"><span className="text-sm font-semibold text-foreground">Payment Receipt Sync</span><div className="font-mono text-xs text-teal-500">0x1c9...8e4</div></div>
                    <div className="w-full bg-card border-l-4 border-primary p-4 rounded-r-xl shadow-lg flex justify-between items-center ml-8"><span className="text-sm font-semibold text-foreground">Loan Finalized</span><div className="font-mono text-xs text-primary">0x5f2...7a1</div></div>
                 </motion.div>
              </div>
            </motion.div>
          </motion.section>
          
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="pb-24 pt-16 text-center">
            <motion.div variants={fadeIn} className="bg-gradient-to-r from-card to-muted p-12 md:p-16 rounded-[2.5rem] border border-border flex flex-col items-center">
                <h2 className="text-4xl font-extrabold mb-6">Secured the first day. Guaranteed forever.</h2>
                <Button size="lg" className="rounded-full px-10 py-6 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow">
                  Read our Whitepaper <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
            </motion.div>
          </motion.section>

        </div>
      </div>
    </PublicLayout>
  );
}