import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layouts/PublicLayout";
import {
  Fingerprint,
  UserCheck,
  Layers,
  Activity,
  Wallet,
  Eye,
  Check,
  BrainCircuit,
  CreditCard,
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Fingerprint,
      title: "KYC Engine",
      description:
        "End-to-end borrower onboarding with document verification and status-driven workflows.",
      details: [
        "Tenant-aware borrower KYC workflow",
        "Document and identity status tracking",
        "Role-controlled KYC review actions",
        "Audit-ready KYC history",
      ],
    },
    {
      icon: UserCheck,
      title: "Borrower Profiles",
      description:
        "Structured borrower profiles connected to contracts, loans, schedules, and transaction trails.",
      details: [
        "Borrower-to-tenant relationship mapping",
        "Loan and repayment visibility",
        "Status lifecycle from request to closure",
        "Unified history for lender decisioning",
      ],
    },
    {
      icon: Layers,
      title: "Multi-Tenant RBAC + Super Admin Control",
      description:
        "Institution-level tenancy with strict role and permission boundaries, plus global super-admin governance.",
      details: [
        "Role/permission management by scope",
        "Tenant-isolated operational data",
        "Super-admin-only subscription control",
        "Fine-grained endpoint authorization",
      ],
    },
    {
      icon: Activity,
      title: "Transaction Orchestrator",
      description:
        "Policy-driven transaction orchestration resolves wallet, gas payer, subscription scope, and eligibility in one flow.",
      details: [
        "Gas mode: AUTO / USER_WALLET / PLATFORM_WALLET",
        "Subscription-aware eligibility checks",
        "Wallet resolution by platform",
        "Persisted policy evaluation metadata",
      ],
    },
    {
      icon: Wallet,
      title: "Wallet Abstraction",
      description:
        "Unified wallet layer across web and app with provider-aware handling and primary wallet management.",
      details: [
        "MetaMask for user-paid gas on web",
        "Secure app wallet registration",
        "Primary wallet switching",
        "Per-user gas preference controls",
      ],
    },
    {
      icon: CreditCard,
      title: "Subscriptions + Pricing + Tenant Payment Config",
      description:
        "Built-in plan catalog with public pricing, purchase flows, and tenant-level eSewa/Khalti credential routing.",
      details: [
        "Plans: free, premium, pro, enterprise",
        "Public pricing route for non-logged users",
        "Super-admin plan CRUD",
        "Tenant payment gateway config management",
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
            Everything implemented in the platform: KYC, lending workflows,
            wallet orchestration, subscriptions, and tenant payment controls.
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
