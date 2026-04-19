import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  MousePointerClick,
  ShieldCheck,
  Zap,
  Star
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import PublicLayout from "@/components/layouts/PublicLayout";
import { cn } from "@/lib/utils";

interface HowItWorksProps {
  showHeader?: boolean;
  showFooter?: boolean;
  isSubcomponent?: boolean;
}

export default function HowItWorks({ 
  showHeader = true, 
  showFooter = true,
  isSubcomponent = false 
}: HowItWorksProps) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -50]);
  const y2 = useTransform(scrollY, [0, 500], [0, 80]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const content = (
    <div className={cn(
      "bg-background text-foreground scroll-smooth overflow-x-hidden relative",
      isSubcomponent && "py-12 md:py-24"
    )}>
      {/* Parallax Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-[15%] left-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 rounded-full blur-[100px] opacity-30" 
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-[25%] right-[10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-emerald-500/5 rounded-full blur-[120px] opacity-40" 
        />
      </div>

      {/* Header */}
      {!isSubcomponent && (
        <div className="relative z-10 pt-16 pb-8 md:pt-24 md:pb-12 text-center overflow-hidden">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto px-6"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-6">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-primary text-[10px] md:text-xs font-black tracking-widest uppercase">
                The Protocol
              </span>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h1 className="text-3xl md:text-5xl font-black mb-6 leading-[1.1] uppercase tracking-widest">
                Modular <span className="text-primary">Operations</span>
              </h1>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
                Autonomous tenant activation and debt settlement orchestrating
                the lending lifecycle.
              </p>
            </motion.div>
          </motion.div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 space-y-20 md:space-y-32 pb-12 md:pb-20">
        {/* Phase 1 */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center"
        >
          <motion.div variants={fadeIn}>
            <Badge className="bg-primary/10 text-primary mb-4 px-3 py-1 text-[10px] font-black uppercase tracking-widest leading-none">
              Phase 1
            </Badge>
            <h2 className="text-2xl md:text-3xl font-black mb-6 leading-tight uppercase tracking-widest text-foreground">
              Infrastructure Activation
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed font-medium">
              Initialize your isolated lending environment. Configure
              parameters and compliance logic in your dedicated tenant space.
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: <ShieldCheck className="w-4 h-4" />,
                  title: "Isolation",
                  desc: "Cryptographically siloed environment.",
                },
                {
                  icon: <MousePointerClick className="w-4 h-4" />,
                  title: "Deployment",
                  desc: "Commit parameters to the blockchain instantly.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-background/30 flex items-center justify-center text-primary shrink-0 transition-transform hover:scale-110 shadow-soft">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-black mb-1 uppercase tracking-widest">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="relative flex items-center justify-center p-4 md:p-8 no-spotlight"
          >
            <img
              src="/static/contracts.png"
              alt="Infrastructure Activation"
              className="w-full h-auto max-w-[450px] md:max-w-[550px] object-contain organic-glow"
            />
          </motion.div>
        </motion.section>

        {/* Phase 2 */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center"
        >
          <motion.div
            variants={fadeIn}
            className="order-2 lg:order-1 relative flex items-center justify-center p-4 md:p-8 no-spotlight"
          >
            <img
              src="/static/verify.png"
              alt="Validation Engine"
              className="w-full h-auto max-w-[450px] md:max-w-[550px] object-contain organic-glow"
            />
          </motion.div>

          <motion.div variants={fadeIn} className="order-1 lg:order-2">
            <Badge className="bg-primary/10 text-primary mb-4 px-3 py-1 text-[10px] font-black uppercase tracking-widest leading-none">
              Phase 2
            </Badge>
            <h2 className="text-2xl md:text-3xl font-black mb-6 leading-tight uppercase tracking-widest text-foreground">
              Validation & Settlement
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed font-medium">
              AI-driven artifacts validation and risk scoring for automated
              disbursement.
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: <Zap className="w-4 h-4" />,
                  title: "Verifications",
                  desc: "Integrated OCR and biometric engine.",
                },
                {
                  icon: <CheckCircle2 className="w-4 h-4" />,
                  title: "Finality",
                  desc: "Every transition notarized on the blockchain.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-background/30 flex items-center justify-center text-primary shrink-0 transition-transform hover:scale-110 shadow-soft">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-black mb-1 uppercase tracking-widest">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Global CTA */}
        {!isSubcomponent && (
          <div className="max-w-7xl mx-auto mt-12 md:mt-20">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="bg-surface/60 p-8 md:p-16 lg:p-24 rounded-[2rem] md:rounded-[3rem] text-center relative overflow-hidden shadow-card backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-6 md:mb-8 text-foreground leading-tight uppercase tracking-widest">
                  Ready to Deploy Your Own Node?
                </h2>
                <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 md:mb-16 leading-relaxed font-medium">
                  Experience the transparency and efficiency of a
                  blockchain-backed lending protocol. Sign up for a technical
                  deep-dive today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
                  <Button
                    size="lg"
                    className="h-12 md:h-14 px-8 md:px-10 text-xs md:text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-black shadow-soft uppercase tracking-widest"
                  >
                    Architecture Demo
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 md:h-14 px-8 md:px-10 text-xs md:text-sm border-border text-foreground hover:bg-muted rounded-2xl font-black uppercase tracking-widest"
                  >
                    Technical Docs
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );

  if (isSubcomponent) return content;

  return (
    <PublicLayout showHeader={showHeader} showFooter={showFooter}>
      {content}
    </PublicLayout>
  );
}
