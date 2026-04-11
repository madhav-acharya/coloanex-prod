import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Users, Building2, Lock, Check, Workflow } from "lucide-react";

export default function UseCases() {
  const useCases = [
    {
      title: "Digital Lending SaaS Operators",
      description:
        "Run multi-tenant lending operations with subscription-driven features and orchestrated transaction policies.",
      icon: Users,
      benefits: [
        "Public pricing funnel with user/tenant plan purchase",
        "Wallet abstraction across web and app",
        "Policy-aware gas sponsorship modes",
        "Super-admin plan governance",
      ],
      stats: {
        loans: "Multi-tenant",
        users: "Role-based",
        satisfaction: "Policy-driven",
      },
    },
    {
      title: "Microfinance and Cooperative Networks",
      description:
        "Manage borrower onboarding, repayment workflows, and tenant-specific payment gateway credentials.",
      icon: Building2,
      benefits: [
        "Tenant payment config for eSewa/Khalti",
        "Webhook processing with idempotency logs",
        "Borrower and contract lifecycle tracking",
        "Role-guarded operational actions",
      ],
      stats: {
        loans: "Configurable",
        users: "Tenant scoped",
        satisfaction: "Auditable",
      },
    },
    {
      title: "Compliance-First Lending Teams",
      description:
        "Apply strict access control and maintain transparent transaction decision trails for compliance teams.",
      icon: Lock,
      benefits: [
        "RBAC with super-admin controls",
        "Transaction policy evaluation history",
        "Gas payer and wallet source traceability",
        "Subscription scope visibility (user vs tenant)",
      ],
      stats: {
        loans: "Traceable",
        users: "Controlled",
        satisfaction: "Governed",
      },
    },
  ];

  const testimonials = [
    {
      quote:
        "The split between public pricing and secured admin controls helped us onboard faster without exposing operations.",
      author: "Operations Lead",
      role: "Digital Lending Platform",
      company: "Tenant SaaS Deployment",
    },
    {
      quote:
        "Tenant-level gateway config plus wallet orchestration gave us flexibility without sacrificing auditability.",
      author: "Risk Manager",
      role: "Microfinance Network",
      company: "Regional Lending Operations",
    },
    {
      quote:
        "Super-admin subscription governance and policy logs made internal review and access control significantly easier.",
      author: "Technology Director",
      role: "Compliance-Focused Lender",
      company: "Enterprise Credit Team",
    },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero dark:bg-gradient-dark text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Workflow className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Built for Your Industry
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Real scenarios supported by the current platform implementation:
            public pricing, subscription plans, wallet orchestration, and
            tenant-secure operations.
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-primary/10 dark:bg-card py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-20">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`grid md:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className={index % 2 === 1 ? "md:order-2" : ""}>
                <Card className="bg-gradient-dark border-0 text-white h-full">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                      <useCase.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">{useCase.title}</h3>
                    <p className="text-white/80 text-lg mb-6">
                      {useCase.description}
                    </p>
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {useCase.stats.loans}
                        </div>
                        <div className="text-sm text-white/60">
                          Active Loans
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {useCase.stats.users}
                        </div>
                        <div className="text-sm text-white/60">Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {useCase.stats.satisfaction}
                        </div>
                        <div className="text-sm text-white/60">
                          Satisfaction
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className={index % 2 === 1 ? "md:order-1" : ""}>
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Key Benefits
                </h3>
                <div className="space-y-4">
                  {useCase.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                      <p className="text-lg text-muted-foreground">{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 dark:bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our clients have to say about their experience
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-gradient-dark dark:bg-card text-white dark:text-foreground border-0 shadow-card"
              >
                <CardContent className="p-8">
                  <p className="text-muted-foreground dark:text-muted-foreground mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-semibold text-white dark:text-foreground">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-white/60 dark:text-muted-foreground">
                      {testimonial.role}
                    </p>
                    <p className="text-sm text-primary">
                      {testimonial.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background dark:bg-card">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            See How Coloanex Works for Your Industry
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Schedule a personalized demo to discover how we can transform your
            lending operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="lg">
                Get Started Free
              </Button>
            </Link>
            <Button variant="heroOutline" size="lg">
              <Link to="/signup">Schedule Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
