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
      title: "Tenant-Isolated Data Boundaries",
      description:
        "Core domain data is separated by tenant boundaries with explicit role/permission checks per endpoint.",
    },
    {
      icon: Lock,
      title: "Role and Permission Enforcement",
      description:
        "Super admin, admin, lender, and borrower roles enforce least-privilege access across API and UI.",
    },
    {
      icon: Eye,
      title: "Subscription Policy Guardrails",
      description:
        "Transaction policy evaluation persists eligibility decisions, denial reasons, and gas payer resolution data.",
    },
    {
      icon: FileCheck,
      title: "Webhook Idempotency and Traceability",
      description:
        "Payment webhook events are stored with unique gateway-event keys to prevent duplicate processing.",
    },
    {
      icon: Server,
      title: "Tenant Gateway Secret Management",
      description:
        "eSewa and Khalti keys are isolated per tenant configuration and resolved at runtime for each payment flow.",
    },
    {
      icon: UserCheck,
      title: "Wallet Source Control",
      description:
        "User wallet vs platform gas sponsorship is explicitly controlled through gas mode and orchestrator checks.",
    },
  ];

  const complianceStandards = [
    {
      name: "RBAC Governance",
      description:
        "Permission-aware access to users, tenants, roles, and payments",
    },
    {
      name: "Tenant Isolation",
      description: "Scoped resource access by tenant context and role",
    },
    {
      name: "Auditability",
      description:
        "Policy evaluations and payment webhook events are persisted",
    },
    {
      name: "Operational Controls",
      description:
        "Plan and gateway configuration restricted to authorized admins",
    },
  ];

  const securityPractices = [
    "JWT-protected endpoints with explicit public route overrides",
    "Role + permission checks on sensitive management actions",
    "Super-admin-only subscription catalog administration",
    "Tenant payment config upsert and delete authorization checks",
    "Idempotent payment webhook storage to prevent duplicate side effects",
    "Wallet ownership checks before primary switch and deletion",
    "Transaction policy evaluation logging for audit and troubleshooting",
    "Gas payer resolution with fallback safety rules",
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero dark:bg-gradient-dark text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Enterprise-Grade Security
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Security is implemented as policy and architecture: RBAC, tenant
            isolation, idempotent payment workflows, and auditable transaction
            decisions.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="bg-primary/10 dark:bg-card py-20 px-4 sm:px-6 lg:px-8">
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
                className="bg-gradient-dark dark:bg-popover text-white dark:text-foreground border-0 shadow-card hover:shadow-soft transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className=" flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-white dark:text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 dark:text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 dark:bg-background">
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
