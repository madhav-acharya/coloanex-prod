import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  MousePointerClick,
  ShieldCheck,
  Zap,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import PublicLayout from "@/components/layouts/PublicLayout";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const content = (
    <div className={cn(
      "bg-background text-foreground",
      isSubcomponent && "py-12 md:py-24"
    )}>
      {!isSubcomponent && (
        <div className="pt-20 pb-8 md:pt-32 md:pb-12 text-center border-b border-border/20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto px-4 sm:px-6"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-1.5 mb-6">
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
                Autonomous tenant activation and debt settlement orchestrating the lending lifecycle.
              </p>
            </motion.div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-28 pb-12 md:pb-20 pt-8">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center"
        >
          <motion.div variants={fadeIn}>
            <Badge className="bg-primary/10 text-primary mb-4 px-3 py-1 text-[10px] font-black uppercase tracking-widest leading-none">
              Phase 1
            </Badge>
            <h2 className="text-2xl md:text-3xl font-black mb-6 leading-tight uppercase tracking-widest text-foreground">
              Infrastructure Activation
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed font-medium">
              Initialize your isolated lending environment. Configure parameters and compliance logic in your dedicated tenant space.
            </p>
            <div className="space-y-5">
              {[
                { icon: <ShieldCheck className="w-4 h-4" />, title: "Isolation", desc: "Cryptographically siloed environment." },
                { icon: <MousePointerClick className="w-4 h-4" />, title: "Deployment", desc: "Commit parameters to the blockchain instantly." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-background/50 border border-border/30 flex items-center justify-center text-primary shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black mb-1 uppercase tracking-widest">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="relative flex items-center justify-center p-4 md:p-8">
            <img
              src="/static/contracts.png"
              alt="Infrastructure Activation"
              className="w-full h-auto max-w-[400px] md:max-w-[500px] object-contain organic-glow"
            />
          </motion.div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center"
        >
          <motion.div variants={fadeIn} className="order-2 lg:order-1 relative flex items-center justify-center p-4 md:p-8">
            <img
              src="/static/verify.png"
              alt="Validation Engine"
              className="w-full h-auto max-w-[400px] md:max-w-[500px] object-contain organic-glow"
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
              AI-driven artifacts validation and risk scoring for automated disbursement.
            </p>
            <div className="space-y-5">
              {[
                { icon: <Zap className="w-4 h-4" />, title: "Verifications", desc: "Integrated OCR and biometric engine." },
                { icon: <CheckCircle2 className="w-4 h-4" />, title: "Finality", desc: "Every transition notarized on the blockchain." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-background/50 border border-border/30 flex items-center justify-center text-primary shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black mb-1 uppercase tracking-widest">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {!isSubcomponent && (
          <div className="w-full border-y border-border/20 bg-muted/5">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center"
            >
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-6 text-foreground leading-tight uppercase tracking-widest">
                  Ready to Deploy Your Own Node?
                </h2>
                <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                  Experience the transparency and efficiency of a blockchain-backed lending protocol.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="h-12 md:h-14 px-8 text-xs md:text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest"
                    onClick={() => navigate("/signup")}
                  >
                    Architecture Demo
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 md:h-14 px-8 text-xs md:text-sm border-border text-foreground hover:bg-muted font-black uppercase tracking-widest"
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
