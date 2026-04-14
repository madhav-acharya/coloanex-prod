import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Factory, GraduationCap, Stethoscope, ShoppingBag, ArrowRight } from "lucide-react";
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
      icon: <Factory className="w-12 h-12 mb-4 text-primary" />,
      color: "from-primary to-accent"
    },
    {
      title: "Educational Grants",
      desc: "Universities and independent lenders can offer structured, stage-based loans to students that only disburse when passing specific academic milestones.",
      icon: <GraduationCap className="w-12 h-12 mb-4 text-emerald-500" />,
      color: "from-emerald-500 to-teal-400"
    },
    {
      title: "Medical Equipment Leasing",
      desc: "High-value machines can be financed seamlessly by private clinics. Multi-signature checks ensure equipment is verified before funds move.",
      icon: <Stethoscope className="w-12 h-12 mb-4 text-accent" />,
      color: "from-accent to-indigo-500"
    },
    {
      title: "Retail Expansion Capital",
      desc: "Micro-loans to brick and mortar shops based on real-time integrated sales data. Adjust lending policies dynamically in the web tenant.",
      icon: <ShoppingBag className="w-12 h-12 mb-4 text-purple-500" />,
      color: "from-purple-500 to-fuchsia-500"
    }
  ];

  return (
    <PublicLayout>
      <div className="bg-background text-foreground transition-colors duration-300 pb-32">
        <div className="relative pt-32 pb-24 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="container mx-auto px-4 max-w-5xl">
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-6 py-1.5 px-6 text-sm bg-primary/10 text-primary border-primary/20 shadow-glow">
                Industry Applications
              </Badge>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 text-foreground leading-[1.1]">
                Revolutionizing <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Use Cases</span> Everywhere
              </h1>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
                Coloanex isn't just for traditional microfinance. Because of our isolated tenant architecture, any enterprise can become their own specialized lending facility.
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid md:grid-cols-2 gap-8">
            {cases.map((useCase, idx) => (
              <motion.div key={idx} variants={fadeIn} className="group h-full">
                <Card className="h-full bg-card hover:bg-muted/50 transition-colors border-border/50 overflow-hidden relative">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${useCase.color} rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                  <CardContent className="p-10 flex flex-col h-full relative z-10">
                    {useCase.icon}
                    <h3 className="text-2xl font-bold mb-4">{useCase.title}</h3>
                    <p className="text-lg text-muted-foreground mb-8 flex-1">{useCase.desc}</p>
                    <div className="mt-auto">
                      <Button variant="link" className="p-0 text-foreground group-hover:text-primary transition-colors">
                        Learn more about this integration <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      
        <div className="container mx-auto px-4 max-w-7xl mt-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Optimized for Diverse Scale</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our infrastructure doesn’t just conform to one set of rules. We built Coloanex to be entirely agnostic to lending environments, dynamically routing KYC verifications, risk analysis, and smart-contract execution according to each tenant’s specified parameters.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-[2rem] border shadow-glow transition-all hover:-translate-y-2 cursor-pointer">
              <h3 className="text-xl font-bold mb-3">Enterprise Consortia</h3>
              <p className="text-muted-foreground mb-4">
                Pool liquidity across multiple legal entities and automate loan allocations through round-robin or proportionate fractional algorithms, ensuring zero single-point failure alongside immutable record-keeping.
              </p>
              <ul className="space-y-2 text-sm font-medium">
                <li className="flex items-center text-primary"><ArrowRight className="w-4 h-4 mr-2" /> Tiered admin approvals</li>
                <li className="flex items-center text-primary"><ArrowRight className="w-4 h-4 mr-2" /> Global compliance integration</li>
              </ul>
            </div>
            <div className="bg-card p-8 rounded-[2rem] border shadow-glow transition-all hover:-translate-y-2 cursor-pointer">
              <h3 className="text-xl font-bold mb-3">P2P Marketplaces</h3>
              <p className="text-muted-foreground mb-4">
                Run fully fledged matching engines. Borrowers submit requests; retail lenders supply partial or complete funds. We orchestrate the escrow and milestone disbursements.
              </p>
              <ul className="space-y-2 text-sm font-medium">
                <li className="flex items-center text-primary"><ArrowRight className="w-4 h-4 mr-2" /> Fractional investments</li>
                <li className="flex items-center text-primary"><ArrowRight className="w-4 h-4 mr-2" /> Decentralized settlements</li>
              </ul>
            </div>
            <div className="bg-card p-8 rounded-[2rem] border shadow-glow transition-all hover:-translate-y-2 cursor-pointer">
              <h3 className="text-xl font-bold mb-3">Microfinance Foundations</h3>
              <p className="text-muted-foreground mb-4">
                Operate gracefully in rural or low-bandwidth environments. Empower field-agents with specialized mobile capabilities while head-office maintains complete macroeconomic analytics over regional activities.
              </p>
              <ul className="space-y-2 text-sm font-medium">
                <li className="flex items-center text-primary"><ArrowRight className="w-4 h-4 mr-2" /> Offline mode syncing</li>
                <li className="flex items-center text-primary"><ArrowRight className="w-4 h-4 mr-2" /> Mobile gateway payments</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Closing CTA */}
        <div className="container mx-auto px-4 max-w-7xl mt-32 text-center pb-12">
          <div className="bg-primary/5 p-12 rounded-[3rem] border border-primary/20 backdrop-blur-sm">
            <h2 className="text-3xl font-extrabold mb-6">Discover the Specifics for Your Model</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Don’t see your exact use case represented? Our Tenant Rules Engine is Turing-complete for conditional logic.
            </p>
            <Button size="lg" className="rounded-full px-8 py-6 text-lg cursor-pointer">
               Discuss Your Requirements <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}