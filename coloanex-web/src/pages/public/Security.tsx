import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Globe,
  Key,
  Fingerprint
} from "lucide-react";
import { motion } from "framer-motion";
import PublicLayout from "@/components/layouts/PublicLayout";

interface SecurityProps {
  isSubcomponent?: boolean;
  showFooter?: boolean;
}

export default function Security({ isSubcomponent = false, showFooter = true }: SecurityProps) {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const securityFeatures = [
    {
      icon: <Lock className="w-5 h-5" />,
      title: "AES-256 Encryption",
      desc: "All data at rest and in transit is encrypted using military-grade AES-256 protocols."
    },
    {
      icon: <Fingerprint className="w-5 h-5" />,
      title: "Biometric Auth",
      desc: "Native support for FaceID and TouchID to ensure only authorized personnel access the ledger."
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "Immutable Ledger",
      desc: "Every loan event is notarized on a private blockchain, making historical data impossible to alter."
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Real-time Monitoring",
      desc: "Continuous automated scanning for anomalous transaction patterns and multi-sig failures."
    }
  ];

  const content = (
    <div className="bg-background text-foreground">
      {!isSubcomponent && (
        <div className="pt-20 pb-8 md:pt-32 md:pb-12 text-center border-b border-border/20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto px-4 sm:px-6"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-emerald-500/10 px-4 py-1.5 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
              <span className="text-emerald-500 text-[10px] md:text-xs font-black tracking-widest uppercase">
                Bank-Grade Protection
              </span>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h1 className="text-3xl md:text-5xl font-black mb-6 leading-[1.1] uppercase tracking-widest">
                Hardened <span className="text-primary">Protocols</span>
              </h1>
            </motion.div>
            <motion.div variants={fadeIn}>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
                Our infrastructure is built on a foundation of zero-trust architecture and cryptographic finality.
              </p>
            </motion.div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-28 pt-8">
        {isSubcomponent && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mb-12 text-center"
          >
            <Badge variant="outline" className="mb-4 py-1.5 px-4 text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase font-black tracking-widest">
              Security
            </Badge>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest">
              Hardened <span className="text-primary">Protocols</span>
            </h2>
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="relative w-full h-[180px] md:h-[320px] overflow-hidden mb-12 md:mb-20"
        >
          <img
            src="/static/anyone.png"
            className="w-full h-full object-cover opacity-60 scale-105"
            alt="Security Infrastructure"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute bottom-6 md:bottom-10 left-4 sm:left-8 md:left-12 max-w-md">
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-widest text-foreground">
              Zero-Trust <span className="text-emerald-500 underline decoration-primary decoration-4 underline-offset-8">Philosophy</span>
            </h2>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {securityFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeIn}
              className="bg-muted/10 border border-border/30 p-6 md:p-8 transition-all group hover:border-emerald-500/30 hover:bg-muted/20"
            >
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-sm md:text-base font-black mb-3 uppercase tracking-widest group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="w-full bg-primary/5 border-y border-primary/10 py-12 md:py-20 text-center"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Badge className="bg-emerald-500/20 text-emerald-500 mb-6 px-4 py-1 text-[10px] font-black uppercase tracking-widest">
              Global Compliance
            </Badge>
            <h2 className="text-2xl md:text-4xl font-black mb-8 uppercase tracking-widest text-foreground">
              Built for <span className="text-primary">Jurisdictional</span> Flexibility
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-12 leading-relaxed font-medium">
              Our protocol supports regional data sovereignty requirements, ensuring that sensitive borrower information never leaves your specified jurisdiction.
            </p>
            <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <Globe className="w-7 h-7 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">GDPR Ready</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">SOC2 Compliant</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Key className="w-7 h-7 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">ISO 27001</span>
              </div>
            </div>
          </div>
        </motion.div>
    </div>
  );

  if (isSubcomponent) return content;

  return (
    <PublicLayout showFooter={showFooter}>
      {content}
    </PublicLayout>
  );
}
