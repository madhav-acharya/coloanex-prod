import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workflow, Layers, ShieldCheck, Globe, Smartphone, BarChart3, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import PublicLayout from "@/components/layouts/PublicLayout";
import { motion } from "framer-motion";

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };

export default function Features() {
  return (
    <PublicLayout>
      <div className="bg-background text-foreground transition-colors duration-300 pb-20 overflow-hidden">
        
        {/* Dynamic Hero */}
        <div className="relative pt-32 pb-24 flex flex-col items-center justify-center text-center overflow-hidden">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 150, ease: "linear" }} className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)] z-0 pointer-events-none"></motion.div>
          
          <motion.div initial="hidden" animate="visible" variants={stagger} className="container mx-auto px-4 max-w-5xl relative z-10">
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-6 py-1.5 px-6 text-sm bg-primary/10 text-primary border-primary/20 shadow-glow">
                Enterprise Feature Suite
              </Badge>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter mb-8 text-foreground leading-[1.1]">
                Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Scale Credit</span>
              </h1>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
                Coloanex was engineered from the ground up for massive scaling. Real-time synchronicity, mathematical trust via blockchain, and unparalleled analytics. 
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Feature Tabs section */}
        <div className="container mx-auto px-4 max-w-6xl mt-12 mb-24">
          <Tabs defaultValue="management" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1 bg-muted/50 rounded-2xl mb-12">
              <TabsTrigger value="management" className="py-4 text-base md:text-lg font-semibold rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all"><Layers className="w-5 h-5 mr-2" /> Web Management</TabsTrigger>
              <TabsTrigger value="borrower" className="py-4 text-base md:text-lg font-semibold rounded-xl data-[state=active]:bg-card data-[state=active]:text-accent data-[state=active]:shadow-lg transition-all"><Smartphone className="w-5 h-5 mr-2" /> Borrower App</TabsTrigger>
              <TabsTrigger value="security" className="py-4 text-base md:text-lg font-semibold rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all"><ShieldCheck className="w-5 h-5 mr-2" /> Security Engine</TabsTrigger>
            </TabsList>

            {/* Management Tab Content */}
            <TabsContent value="management">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-4">Complete Operational Superiority</h3>
                  <p className="text-lg text-muted-foreground mb-8">Administrate the whole lending pipeline, customize terms, manage distinct regions seamlessly.</p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 border border-border/50 rounded-xl bg-card/50">
                       <Workflow className="w-8 h-8 text-primary shrink-0" />
                       <div><h4 className="font-semibold text-lg">Multi-Tier Approvals</h4><p className="text-sm text-muted-foreground mt-1">Implement rigid verification and multi-signature authorization processes to prevent internal fraud.</p></div>
                    </div>
                    <div className="flex gap-4 p-4 border border-border/50 rounded-xl bg-card/50">
                       <BarChart3 className="w-8 h-8 text-primary shrink-0" />
                       <div><h4 className="font-semibold text-lg">Real-Time Data Pipelines</h4><p className="text-sm text-muted-foreground mt-1">Dashboards update seamlessly instantly as borrowers apply or make payments across devices without page reloads.</p></div>
                    </div>
                    <div className="flex gap-4 p-4 border border-border/50 rounded-xl bg-card/50">
                       <Globe className="w-8 h-8 text-primary shrink-0" />
                       <div><h4 className="font-semibold text-lg">Multi-Tenant Architecture</h4><p className="text-sm text-muted-foreground mt-1">Spin up distinct branches or regions underneath one main organization with distinct rule structures.</p></div>
                    </div>
                    <div className="flex gap-4 p-4 border border-border/50 rounded-xl bg-card/50">
                       <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
                       <div><h4 className="font-semibold text-lg">Proof of Compliance</h4><p className="text-sm text-muted-foreground mt-1">Every operational decision is cryptographically signed and stored, creating an immutable audit trail for regulators.</p></div>
                    </div>
                  </div>
                </div>
                
                <div className="relative aspect-square flex items-center justify-center p-8">
                  <div className="absolute inset-0 bg-primary/5 rounded-[3rem] -rotate-6"></div>
                  <div className="w-full h-full bg-card shadow-2xl rounded-3xl border border-primary/20 p-6 flex flex-col relative z-10 overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="flex-1 h-3 bg-muted rounded-full"></div>
                       <div className="w-24 h-3 bg-muted rounded-full"></div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="bg-primary/10 rounded-2xl flex items-end p-4"><div className="w-full h-2/3 bg-primary/20 rounded-t-xl overflow-hidden relative"><motion.div animate={{ height: ["0%", "100%", "50%"] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bottom-0 w-full bg-primary/80 dark:bg-primary border border-primary/50 shadow-[0_0_15px_rgba(22,163,74,0.5)]"></motion.div></div></div>
                      <div className="bg-accent/10 rounded-2xl flex items-end p-4"><div className="w-full h-full bg-accent/20 rounded-t-xl overflow-hidden relative"><motion.div animate={{ height: ["100%", "30%", "80%"] }} transition={{ duration: 4, repeat: Infinity }} className="absolute bottom-0 w-full bg-primary/80 dark:bg-primary border border-primary/50 shadow-glow"></motion.div></div></div>
                    </div>
                    <div className="mt-4 flex gap-4">
                       <div className="flex-1 h-12 bg-foreground/5 dark:bg-foreground/10 border border-border/50 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground shadow-sm">View</div>
                       <div className="flex-1 h-12 bg-foreground/5 dark:bg-foreground/10 border border-border/50 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground shadow-sm">View</div>
                       <div className="flex-1 h-12 bg-foreground/5 dark:bg-foreground/10 border border-border/50 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground shadow-sm">View</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Borrower Tab Content */}
            <TabsContent value="borrower">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 relative aspect-square flex items-center justify-center p-8">
                   <div className="absolute inset-0 bg-accent/5 rounded-[3rem] rotate-3"></div>
                   <div className="w-[280px] h-[550px] bg-card shadow-2xl rounded-[3rem] border-8 border-foreground/10 p-6 flex flex-col relative z-10 overflow-hidden items-center">
                     <div className="w-16 h-4 bg-foreground/10 absolute top-0 rounded-b-xl"></div>
                     <div className="w-20 h-20 bg-accent/20 rounded-full mt-12 mb-6 flex items-center justify-center text-accent"><CheckCircle2 className="w-10 h-10" /></div>
                     <h4 className="text-xl font-bold mb-2">Loan Approved</h4>
                     <p className="text-sm text-muted-foreground text-center mb-6">Your requested $5,000 has been verified.</p>
                     <div className="w-full space-y-3">
                         <div className="h-10 bg-foreground/5 dark:bg-foreground/10 w-full rounded-lg border border-border/50 flex items-center pl-3"><span className="text-[10px] text-muted-foreground font-medium">Verify Block</span></div>
                         <div className="h-10 bg-foreground/5 dark:bg-foreground/10 w-full rounded-lg border border-border/50 flex items-center pl-3"><span className="text-[10px] text-muted-foreground font-medium">Verify Block</span></div>
                         <div className="h-10 bg-foreground/5 dark:bg-foreground/10 w-full rounded-lg border border-border/50 flex items-center pl-3"><span className="text-[10px] text-muted-foreground font-medium">Verify Block</span></div>
                     </div>
                     <div className="mt-auto w-full h-12 bg-accent text-accent-foreground font-bold rounded-xl flex items-center justify-center">Accept Terms</div>
                   </div>
                </div>
                
                <div className="order-1 md:order-2">
                  <h3 className="text-3xl font-bold mb-4">Zero Friction for End Users</h3>
                  <p className="text-lg text-muted-foreground mb-8">A smooth mobile experience translates to higher repayment rates and better customer satisfaction.</p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 border border-border/50 rounded-xl bg-card/50">
                       <Smartphone className="w-8 h-8 text-accent shrink-0" />
                       <div><h4 className="font-semibold text-lg">React Native Performance</h4><p className="text-sm text-muted-foreground mt-1">Cross-platform natively compiled UI ensures perfectly smooth animations and interactions regardless of device.</p></div>
                    </div>
                    <div className="flex gap-4 p-4 border border-border/50 rounded-xl bg-card/50">
                       <Clock className="w-8 h-8 text-accent shrink-0" />
                       <div><h4 className="font-semibold text-lg">Reminders Engine</h4><p className="text-sm text-muted-foreground mt-1">Automated push notifications and SMS integrations pre-warn borrowers ahead of repayment schedules.</p></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Security Tab Content */}
            <TabsContent value="security">
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-12">
                   <div className="grid md:grid-cols-3 gap-8 w-full mt-8">
                      <div className="p-8 border border-primary/20 rounded-2xl bg-card shadow-lg hover:shadow-emerald-500/10 transition-shadow">
                          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                          <h4 className="font-bold text-xl mb-2">End-to-End Encryption</h4>
                          <p className="text-sm text-muted-foreground">All payload data moving between frontend and APIs is TLS 1.3 secured and payload hashed.</p>
                      </div>
                      <div className="p-8 border border-primary/20 rounded-2xl bg-card shadow-lg hover:shadow-emerald-500/10 transition-shadow">
                          <Workflow className="w-12 h-12 text-primary mx-auto mb-4" />
                          <h4 className="font-bold text-xl mb-2">Smart Contracts Mapping</h4>
                          <p className="text-sm text-muted-foreground">Coloanex commits loan metadata on-chain to provide an immutable, timestamped auditing verification layer.</p>
                      </div>
                      <div className="p-8 border border-primary/20 rounded-2xl bg-card shadow-lg hover:shadow-emerald-500/10 transition-shadow">
                          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
                          <h4 className="font-bold text-xl mb-2">Continuous Pentesting</h4>
                          <p className="text-sm text-muted-foreground">Our microservices architectures strictly bound the attack surface, ensuring single point failures cannot cross the boundary.</p>
                      </div>
                   </div>
               </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Global CTA */}
        <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="bg-muted p-12 md:p-16 rounded-[2.5rem] border border-border flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl max-w-6xl mx-auto">
              <div>
                 <h2 className="text-3xl font-bold mb-4">See the API and Architecture</h2>
                 <p className="text-lg text-muted-foreground max-w-xl">Whether you integrate via our React SDK or raw REST API, building with Coloanex happens in record time.</p>
              </div>
              <Button size="lg" className="rounded-full px-8 py-6 text-lg tracking-wide shrink-0 shadow-glow group">
                  Start Technical Integration 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
}