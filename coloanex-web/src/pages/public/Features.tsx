import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Shield, 
  BarChart3, 
  Smartphone, 
  Globe, 
  Lock,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import PublicLayout from "@/components/layouts/PublicLayout";
import { cn } from "@/lib/utils";

interface FeaturesProps {
  showHeader?: boolean;
  showFooter?: boolean;
  isSubcomponent?: boolean;
}

export default function Features({ 
  showHeader = true, 
  showFooter = true,
  isSubcomponent = false 
}: FeaturesProps) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -60]);
  const y2 = useTransform(scrollY, [0, 500], [0, 100]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const featureGroups = [
    {
      title: "Core Infrastructure",
      features: [
        {
          icon: <Shield className="w-5 h-5" />,
          title: "Multi-Tenant Architecture",
          desc: "Complete logical isolation for each lending partner with dedicated resource allocation.",
        },
        {
          icon: <Lock className="w-5 h-5" />,
          title: "Immutable Ledger",
          desc: "Every loan lifecycle event is cryptographically signed and committed to a private blockchain.",
        },
        {
          icon: <Sparkles className="w-5 h-5" />,
          title: "AI Risk Engine",
          desc: "Automated document verification and credit scoring using advanced machine learning models.",
        }
      ]
    },
    {
      title: "Operational Excellence",
      features: [
        {
          icon: <Zap className="w-5 h-5" />,
          title: "Instant Settlement",
          desc: "Disbursement and repayment processing in real-time through integrated payment rails.",
        },
        {
          icon: <BarChart3 className="w-5 h-5" />,
          title: "Deep Analytics",
          desc: "Comprehensive dashboard with LP performance, portfolio health, and delinquency tracking.",
        },
        {
          icon: <Smartphone className="w-5 h-5" />,
          title: "Omnichannel Access",
          desc: "Fully responsive borrower portal and admin console optimized for mobile and desktop.",
        }
      ]
    }
  ];

  const content = (
    <div className={cn(
      "bg-background text-foreground scroll-smooth overflow-x-hidden relative min-h-screen",
      isSubcomponent && "min-h-0 py-12 md:py-24"
    )}>
      {/* Parallax Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-[10%] right-[15%] w-[350px] md:w-[550px] h-[350px] md:h-[550px] bg-primary/5 rounded-full blur-[100px] opacity-30" 
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-[20%] left-[5%] w-[450px] md:w-[650px] h-[450px] md:h-[650px] bg-emerald-500/5 rounded-full blur-[120px] opacity-40" 
        />
      </div>

      {/* Hero Section */}
      {!isSubcomponent && (
        <div className="relative z-10 pt-20 pb-8 md:pt-32 md:pb-12 text-center overflow-hidden">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto px-6"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-primary fill-primary" />
              <span className="text-primary text-[10px] md:text-xs font-black tracking-widest uppercase">
                Enterprise Features
              </span>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h1 className="text-3xl md:text-5xl font-black mb-6 leading-[1.1] uppercase tracking-widest">
                Modular <span className="text-primary">Capabilities</span>
              </h1>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
                The most advanced infrastructure for decentralized lending operations at institutional scale.
              </p>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Feature Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 md:pb-32">
        {isSubcomponent && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mb-16 text-center"
          >
             <Badge variant="outline" className="mb-4 py-1.5 px-4 text-[10px] bg-primary/10 text-primary border-primary/20 uppercase font-black tracking-widest">
                Infrastructure
             </Badge>
             <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest leading-tight">
                Enterprise <span className="text-primary">Grade</span>
             </h2>
          </motion.div>
        )}
        {featureGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mt-12 md:mt-24 first:mt-0">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl font-black mb-8 md:mb-12 uppercase tracking-widest border-l-4 border-primary pl-4"
            >
              {group.title}
            </motion.h2>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid md:grid-cols-3 gap-6 md:gap-8"
            >
              {group.features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeIn}
                  className="group bg-surface/40 backdrop-blur-md p-6 md:p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 no-spotlight"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-soft">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-black mb-4 uppercase tracking-widest group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}

        {/* Feature Highlight */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mt-20 md:mt-32 bg-primary/5 rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12"
        >
          <div className="flex-1 text-center md:text-left">
            <Badge className="bg-primary/20 text-primary mb-6 px-4 py-1 text-[10px] font-black uppercase tracking-widest font-headline">
              Infrastructure Peek
            </Badge>
            <h2 className="text-2xl md:text-4xl font-black mb-6 uppercase tracking-widest leading-tight">
              Built for <span className="text-primary">Performance</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-10 leading-relaxed font-medium">
              Our architecture handles thousands of concurrent transactions with sub-second finality. Scale your lending business without infrastructure bottlenecks.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-xl border border-border/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-tighter">99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-xl border border-border/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-tighter">AES-256 Encryption</span>
              </div>
            </div>
          </div>
          <div className="flex-1 relative no-spotlight flex justify-center">
            <img 
              src="/static/blocks.png" 
              alt="Performance UI" 
              className="w-full h-auto max-w-[450px] object-contain organic-glow rotate-2"
            />
          </div>
        </motion.div>
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
