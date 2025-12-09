import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layouts/PublicLayout";
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  Server,
  UserCheck,
  Check,
} from "lucide-react";

export default function Security() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description:
        "256-bit AES encryption for data at rest and TLS 1.3 for data in transit. Your data is always protected.",
    },
    {
      icon: Lock,
      title: "Multi-Factor Authentication",
      description:
        "Support for SMS, email, and authenticator apps. Add an extra layer of security to every account.",
    },
    {
      icon: Eye,
      title: "Role-Based Access Control",
      description:
        "Granular permissions management with department-level isolation. Control who sees what.",
    },
    {
      icon: FileCheck,
      title: "Audit Trails",
      description:
        "Comprehensive logging of all system activities. Every action is tracked and timestamped.",
    },
    {
      icon: Server,
      title: "SOC 2 Type II Compliant",
      description:
        "Annual third-party audits ensure we meet the highest security standards in the industry.",
    },
    {
      icon: UserCheck,
      title: "Regular Security Assessments",
      description:
        "Quarterly penetration testing and vulnerability assessments by independent security firms.",
    },
  ];

  const complianceStandards = [
    {
      name: "SOC 2 Type II",
      description:
        "Annual audits of security, availability, and confidentiality",
    },
    {
      name: "GDPR",
      description: "Full compliance with EU data protection regulations",
    },
    {
      name: "ISO 27001",
      description: "Information security management system certification",
    },
    {
      name: "PCI DSS",
      description: "Payment card industry data security standards",
    },
  ];

  const securityPractices = [
    "Data encrypted at rest with 256-bit AES encryption",
    "All data in transit protected with TLS 1.3",
    "Regular automated and manual security testing",
    "24/7 security monitoring and incident response",
    "Isolated tenant data with strict access controls",
    "Regular employee security training and awareness",
    "Automated backup and disaster recovery systems",
    "Strict vendor security assessment procedures",
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Enterprise-Grade Security
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Your data security is our top priority. We employ industry-leading
            security measures to protect your sensitive information.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="bg-green-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Multi-Layered Security Architecture
            </h2>
            <p className="text-lg text-muted-foreground">
              Protection at every level of your data
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <Card
                key={index}
                className="bg-gradient-dark text-white border-0 shadow-card hover:shadow-soft transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className=" flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Compliance & Certifications
            </h2>
            <p className="text-lg text-muted-foreground">
              Meeting the highest industry standards
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceStandards.map((standard, index) => (
              <Card
                key={index}
                className="bg-gradient-dark text-white border-0 shadow-card"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <FileCheck className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    {standard.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {standard.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Our Security Practices
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive measures to keep your data safe
            </p>
          </div>
          <Card className="bg-gradient-dark text-white border-0 shadow-card">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-6">
                {securityPractices.map((practice, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{practice}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Protection */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-dark text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Your Data, Your Control
              </h2>
              <p className="text-white/80 text-lg mb-6">
                We believe in transparency and giving you complete control over
                your data. You own your data, and you can export or delete it at
                any time.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Data Portability</h4>
                    <p className="text-white/70">
                      Export your data anytime in standard formats
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      Right to Be Forgotten
                    </h4>
                    <p className="text-white/70">
                      Request complete deletion of your data
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      Transparent Practices
                    </h4>
                    <p className="text-white/70">
                      Clear documentation of how we handle your data
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">
                    Security Resources
                  </h3>
                  <div className="space-y-4">
                    <a
                      href="#"
                      className="block p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <h4 className="font-semibold mb-1">
                        Security Whitepaper
                      </h4>
                      <p className="text-sm text-white/70">
                        Detailed overview of our security architecture
                      </p>
                    </a>
                    <a
                      href="#"
                      className="block p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <h4 className="font-semibold mb-1">Privacy Policy</h4>
                      <p className="text-sm text-white/70">
                        How we collect, use, and protect your data
                      </p>
                    </a>
                    <a
                      href="#"
                      className="block p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <h4 className="font-semibold mb-1">Compliance Docs</h4>
                      <p className="text-sm text-white/70">
                        Certifications and audit reports
                      </p>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Questions About Our Security?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our security team is here to answer any questions you may have about
            protecting your data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Contact Security Team
            </Button>
            <Link to="/signup">
              <Button variant="heroOutline" size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
