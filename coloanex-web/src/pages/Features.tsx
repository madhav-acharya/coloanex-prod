import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layouts/PublicLayout";
import {
  Fingerprint,
  UserCheck,
  Layers,
  Activity,
  FolderLock,
  Eye,
  Check,
  BrainCircuit,
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Fingerprint,
      title: "KYC Engine",
      description:
        "Comprehensive identity verification with document validation, liveness checks, and regulatory compliance built-in.",
      details: [
        "Automated document verification",
        "Liveness detection technology",
        "Global compliance standards",
        "Real-time validation",
      ],
    },
    {
      icon: UserCheck,
      title: "Borrower Profiles",
      description:
        "Rich borrower identity profiles with verified credentials, credit history, and trust scores for informed decisions.",
      details: [
        "Complete credit history tracking",
        "Trust score algorithms",
        "Verified credentials system",
        "Risk assessment tools",
      ],
    },
    {
      icon: Layers,
      title: "Multi-Tenant RBAC",
      description:
        "Institution-level tenants with granular role-based access control. Define permissions at every level.",
      details: [
        "Hierarchical permission management",
        "Custom role creation",
        "Department-level isolation",
        "Audit trail for access changes",
      ],
    },
    {
      icon: Activity,
      title: "Audit Logging",
      description:
        "Complete activity trails for every action. Track document uploads, status changes, and user interactions.",
      details: [
        "Comprehensive activity logs",
        "Tamper-proof records",
        "Advanced search and filtering",
        "Compliance-ready exports",
      ],
    },
    {
      icon: FolderLock,
      title: "Secure Document Vault",
      description:
        "Encrypted storage for KYC documents, loan agreements, and sensitive files with access controls.",
      details: [
        "256-bit AES encryption",
        "Version control",
        "Granular access permissions",
        "Automatic backup",
      ],
    },
    {
      icon: Eye,
      title: "Real-Time Monitoring",
      description:
        "Live dashboards tracking loan status, borrower activity, and portfolio health across your organization.",
      details: [
        "Customizable dashboards",
        "Real-time alerts",
        "Performance metrics",
        "Predictive analytics",
      ],
    },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero dark:bg-gradient-dark text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <BrainCircuit className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Powerful Features for Modern Lending
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Everything you need to manage collaborative lending with confidence,
            security, and compliance built-in from day one.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-primary/10 dark:bg-card py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-gradient-dark dark:bg-popover text-white dark:text-foreground border-0 shadow-card hover:shadow-soft transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white dark:text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 dark:text-muted-foreground mb-6">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-white/60 dark:text-muted-foreground">
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 dark:bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your journey with Coloanex today and transform your lending
            operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="lg">
                Get Started Free
              </Button>
            </Link>
            <Link to="/">
              <Button variant="heroOutline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
