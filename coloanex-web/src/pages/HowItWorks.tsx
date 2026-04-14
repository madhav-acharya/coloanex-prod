import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Blocks, ShieldCheck, Smartphone, Monitor, ArrowRight, Wallet, CheckCircle, Scale, Globe, HardDrive } from "lucide-react";
import PublicLayout from "@/components/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };

export default function HowItWorks() {
  return (
    <PublicLayout>
      <div className="bg-background text-foreground transition-colors duration-300 pb-20 overflow-hidden">
        
        {/* Core Hero */}
        <div className="relative pt-32 pb-24 flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background dark:from-primary/20 -z-10" />
          <motion.div initial="hidden" animate="visible" variants={stagger} className="container mx-auto px-4 max-w-5xl">
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-6 py-1.5 px-6 text-sm bg-primary/10 text-primary border-primary/20 shadow-glow cursor-pointer">
                Coloanex Platform Ecosystem
              </Badge>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter mb-8 text-foreground leading-[1.1]">
                How <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">Coloanex</span> Works
              </h1>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
                A unified ecosystem connecting organizational managers on the web with borrowers on mobile, utilizing unbreakable distributed ledger tech to keep every agreement rock solid, transparent, and instantly verified.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Extended Lifecycle Details */}
        <div className="container mx-auto px-4 max-w-6xl space-y-32 mt-12">
          
          {/* Phase 1: Web Dashboard */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeIn}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/60 dark:bg-primary/80 text-primary mb-6 shadow-glow cursor-pointer">
                <Monitor className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Phase 1: Web Dashboard Management</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Every organization gets an isolated, secure virtual workspace (Tenant) on our platform. From here, Super Admins can manage their entire lending portfolio.
              </p>
              <div className="grid gap-6">
                <Card className="bg-card">
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="bg-primary/60 dark:bg-primary/80 p-2 rounded-full"><Building2 className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h4 className="font-semibold">Tenant Instantiation</h4>
                      <p className="text-sm text-muted-foreground mt-1">Register and instantly deploy a customized microfinance environment, mapping directly to your legal entity.</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="bg-primary/60 dark:bg-primary/80 p-2 rounded-full"><Scale className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h4 className="font-semibold">Custom Policy Engine</h4>
                      <p className="text-sm text-muted-foreground mt-1">Stipulate dynamic interest rates, late fees, and minimum requirements tailored to your specific region.</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="bg-primary/60 dark:bg-primary/80 p-2 rounded-full"><CheckCircle className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h4 className="font-semibold">Approval Pipelines</h4>
                      <p className="text-sm text-muted-foreground mt-1">Designate Tier-1 and Tier-2 approvers for incoming multi-stage loan requests from borrowers.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
            <motion.div variants={fadeIn} className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] bg-gradient-to-tr from-accent/10 to-primary/5 border border-border flex items-center justify-center p-8 group hover:shadow-glow cursor-pointer transition-all duration-500">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-full h-full bg-card/80 backdrop-blur-md rounded-xl border border-primary/20 flex flex-col p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-8">
                    <div className="w-40 h-8 bg-primary/60 dark:bg-primary/80 rounded-md"></div>
                    <div className="flex gap-2">
                       <div className="w-8 h-8 rounded-full bg-foreground/10 dark:bg-foreground/20"></div>
                       <div className="w-8 h-8 rounded-full bg-foreground/10 dark:bg-foreground/20"></div>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="w-full h-12 bg-foreground/5 dark:bg-foreground/10 rounded-lg flex items-center px-4"><span className="text-xs font-medium text-primary">Microfinance Setup</span></div>
                    <div className="w-full h-12 bg-foreground/5 dark:bg-foreground/10 rounded-lg flex items-center px-4"><span className="text-xs font-medium text-primary">Deploy Policy Engine</span></div>
                    <div className="w-full h-12 bg-foreground/5 dark:bg-foreground/10 rounded-lg flex items-center px-4"><span className="text-xs font-medium text-primary">Invite Users</span></div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.section>

          <Separator className="my-12 opacity-50" />

          {/* Phase 2: Mobile App */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid md:grid-cols-2 gap-16 items-center md:flex-row-reverse">
            <motion.div variants={fadeIn} className="order-2 md:order-1 relative flex justify-center">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl w-[320px] h-[640px] bg-gradient-to-t from-background to-primary/10 border border-border flex items-center justify-center p-4 group hover:shadow-glow cursor-pointer transition-all duration-500">
                <motion.div animate={{ scale: [1, 1.01, 1] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-full h-full bg-card rounded-[2.5rem] border-[8px] border-foreground/10 flex flex-col overflow-hidden relative shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/10 rounded-b-2xl z-10"></div>
                  <div className="p-6 pt-10 flex-1 flex flex-col gap-6 relative">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/60 dark:bg-primary/80 flex items-center justify-center text-primary"><Wallet className="w-6 h-6" /></div>
                      <div className="flex flex-col gap-2">
                        <div className="w-24 h-4 bg-foreground/10 dark:bg-foreground/20 rounded"></div>
                        <div className="w-16 h-2 bg-foreground/10 rounded"></div>
                      </div>
                    </div>
                    <div className="w-full h-32 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-2xl mt-2 flex flex-col items-center justify-center font-bold shadow-xl p-4 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                      <span className="text-sm opacity-90">Available Credit</span>
                      <span className="text-4xl mt-1">$12,450.00</span>
                    </div>
                    <div className="flex-1 space-y-4 mt-4">
                      <div className="w-full h-14 bg-foreground/5 dark:bg-foreground/10 rounded-xl flex items-center px-4 gap-4"><div className="w-8 h-8 rounded-full bg-background"></div><div className="h-4 w-1/2 bg-background rounded"></div></div>
                      <div className="w-full h-14 bg-foreground/5 dark:bg-foreground/10 rounded-xl flex items-center px-4 gap-4"><div className="w-8 h-8 rounded-full bg-background"></div><div className="h-4 w-1/3 bg-background rounded"></div></div>
                      <div className="w-full h-14 bg-foreground/5 dark:bg-foreground/10 rounded-xl flex items-center px-4 gap-4"><div className="w-8 h-8 rounded-full bg-background"></div><div className="h-4 w-2/3 bg-background rounded"></div></div>
                    </div>
                    <div className="mt-auto flex justify-center pb-2">
                       <div className="w-32 h-1 bg-foreground/10 dark:bg-foreground/20 rounded-full"></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            <motion.div variants={fadeIn} className="order-1 md:order-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/60 dark:bg-primary/80 text-primary mb-6 shadow-glow cursor-pointer">
                <Smartphone className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Phase 2: Mobile App Sync</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Borrowers interact directly through their smartphone. Changes in the web dashboard instantly notify the mobile application ensuring zero lag in processes.
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary">Digital Onboarding & KYC</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Instead of visiting branches, users upload government-issued IDs, self-portraits, and proof of address directly. Background AI verifies documents in real-time before sending to the Web Dashboard.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary">Intuitive Loan Requests</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Users configure their desired principal and tenure. They instantly see estimated interest and repayment schedules before committing, ensuring total transparency.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary">1-Tap Digital Repayments</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Connected with external payment gateways, settling scheduled installments is as simple as biometric authentication right on the phone.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </motion.section>

          <Separator className="my-12 opacity-50" />

          {/* Phase 3: Blockchain */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeIn}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/60 dark:bg-primary/80 text-primary mb-6 shadow-glow cursor-pointer">
                <Blocks className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Phase 3: Blockchain Trust Layer</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Underpinning the manager dashboard and borrower app is our Distributed Ledger Technology. This prevents "he-said, she-said" disputes entirely.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4 p-4 border border-border rounded-xl bg-card hover:bg-foreground/5 dark:bg-foreground/10 transition-colors">
                  <Globe className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg">Permanent Smart Contracts</h4>
                    <p className="text-muted-foreground mt-1">Once approved, terms are compiled into immutable code. No admin or system failure can alter an active loan without transparent cryptographic signatures.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 border border-border rounded-xl bg-card hover:bg-foreground/5 dark:bg-foreground/10 transition-colors">
                  <HardDrive className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg">Immutable Audit Trails</h4>
                    <p className="text-muted-foreground mt-1">Payments recorded on-chain provide mathematical proof of transfers perfectly bridging the gap between isolated financial databases.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeIn} className="relative flex justify-center">
              <div className="relative rounded-3xl w-[400px] h-[400px] overflow-hidden shadow-2xl bg-gradient-to-br from-background to-primary/5 border border-border flex items-center justify-center p-8">
                <div className="relative w-full h-full flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute w-[280px] h-[280px] border-2 border-dashed border-primary/30 rounded-full"/>
                  <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute w-[200px] h-[200px] border-2 border-dashed border-accent/40 rounded-full"/>
                  <div className="absolute w-24 h-24 bg-card rounded-xl shadow-2xl flex items-center justify-center border border-primary/40 z-20 backdrop-blur-xl">
                    <Blocks className="w-12 h-12 text-primary" />
                  </div>
                  
                  {/* Floating nodes */}
                  <motion.div animate={{ x: [0, 20, 0], y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-10 right-10 bg-card p-4 rounded-xl shadow-lg border border-border z-30">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </motion.div>
                  <motion.div animate={{ x: [0, -20, 0], y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="absolute bottom-10 left-10 bg-card p-4 rounded-xl shadow-lg border border-border z-30">
                    <Building2 className="w-6 h-6 text-accent" />
                  </motion.div>
                  <motion.div animate={{ x: [0, -15, 0], y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }} className="absolute top-10 left-10 bg-card p-4 rounded-xl shadow-lg border border-border z-30">
                    <Smartphone className="w-6 h-6 text-emerald-500" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.section>

          
          <Separator className="my-12 opacity-50" />

          {/* Additional Content: Security & FAQ */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="py-8 text-center max-w-4xl mx-auto space-y-12">
            <motion.div variants={fadeIn} className="space-y-6">
              <h2 className="text-4xl font-bold">Uncompromising Security Architecture</h2>
              <p className="text-lg text-muted-foreground-foreground/50 text-left">
                Every transaction on Coloanex passes through multiple layers of military-grade encryption and validation before making it to our immutable ledger. By bridging web dashboards with direct mobile engagement, we ensure absolute transparency. No hidden fees, no opaque terms, just secure lending at micro or macro scales.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 text-left mt-8">
                <Card className="bg-card cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                    <h3 className="font-bold text-lg">Bank-Level Encryption</h3>
                    <p className="text-sm text-muted-foreground-foreground/50">All incoming KYC data and personal identifiable information is AES-256 encrypted at rest.</p>
                  </CardContent>
                </Card>
                <Card className="bg-card cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <Building2 className="w-10 h-10 text-emerald-500" />
                    <h3 className="font-bold text-lg">Tenant Isolation</h3>
                    <p className="text-sm text-muted-foreground-foreground/50">Every organizational deployment gets its own unique, sandboxed database container.</p>
                  </CardContent>
                </Card>
                <Card className="bg-card cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <Globe className="w-10 h-10 text-emerald-500" />
                    <h3 className="font-bold text-lg">Global Compliance</h3>
                    <p className="text-sm text-muted-foreground-foreground/50">Automated KYC integrations cross-check international sanctions and anti-money laundering registries.</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </motion.section>

          {/* FAQ Section */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto pb-16">
            <motion.div variants={fadeIn} className="mb-10 text-center">
              <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-muted-foreground-foreground/50">Common inquiries from our tenant organizations.</p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Accordion type="single" collapsible className="w-full bg-card rounded-2xl border p-4 cursor-pointer">
                <AccordionItem value="faq-1">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary">How long does it take to deploy a new tenant?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground-foreground/50 leading-relaxed text-base pt-2">
                    Instantaneously! The moment you register and configure your initial custom rules, your entire web dashboard and synchronized mobile environments are active.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary">Can we integrate our local payment gateways?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground-foreground/50 leading-relaxed text-base pt-2">
                    Yes. Coloanex comes pre-configured with eSewa and Khalti right out of the box, with generic REST webhooks available for legacy banking systems.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary">Is the blockchain layer mandatory?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground-foreground/50 leading-relaxed text-base pt-2">
                    Our platform utilizes standard databases for fast queries, while leveraging the Sepolia/Ethereum testnet (or mainnet for Enterprise) specifically as the immutable trust anchor for finalized contracts and payment receipts. It runs completely behind the scenes.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </motion.section>

          {/* CTA Section */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="pb-24 pt-16 text-center">
            <motion.div variants={fadeIn} className="bg-gradient-to-r from-card to-muted p-12 md:p-16 rounded-[2.5rem] border border-primary/20 shadow-2xl max-w-4xl mx-auto flex flex-col items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 z-0 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-4xl font-extrabold mb-6 text-foreground">Ready to Build the Future of Finance?</h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Join modern financial institutions globally. Experience exactly how our web management suite controls our borrower mobile environments in absolute real-time lockstep.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Button size="lg" className="rounded-full px-10 py-6 text-lg font-semibold shadow-glow cursor-pointer" asChild>
                    <Link to="/signup">Deploy Your Tenant <ArrowRight className="ml-2 w-6 h-6" /></Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-10 py-6 text-lg font-medium border-primary/30 hover:bg-primary/10 cursor-pointer" asChild>
                    <Link to="/features">Review the Features</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </PublicLayout>
  );
}
