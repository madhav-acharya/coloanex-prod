import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Users, Building2, Lock, Check, Workflow } from "lucide-react";

export default function UseCases() {
  const useCases = [
    {
      title: "P2P Lending Platforms",
      description:
        "Enable peer-to-peer lending with verified borrower profiles and secure document exchange.",
      icon: Users,
      benefits: [
        "Automated borrower verification",
        "Secure fund transfers",
        "Real-time loan matching",
        "Built-in dispute resolution",
      ],
      stats: {
        loans: "50K+",
        users: "100K+",
        satisfaction: "98%",
      },
    },
    {
      title: "Microfinance Institutions",
      description:
        "Streamline loan origination with KYC automation and borrower management at scale.",
      icon: Building2,
      benefits: [
        "Batch processing capabilities",
        "Multi-currency support",
        "Field agent mobile access",
        "Impact reporting tools",
      ],
      stats: {
        loans: "100K+",
        users: "250K+",
        satisfaction: "97%",
      },
    },
    {
      title: "Credit Unions",
      description:
        "Modernize member lending with collaborative workflows and audit-ready documentation.",
      icon: Lock,
      benefits: [
        "Member portal integration",
        "Regulatory compliance tools",
        "Board reporting dashboards",
        "Legacy system integration",
      ],
      stats: {
        loans: "75K+",
        users: "150K+",
        satisfaction: "99%",
      },
    },
  ];

  const testimonials = [
    {
      quote:
        "Coloanex transformed our lending operations. We've seen a 40% increase in loan origination efficiency.",
      author: "Sarah Johnson",
      role: "CEO, FinTech Solutions",
      company: "P2P Lending Platform",
    },
    {
      quote:
        "The compliance features alone have saved us countless hours and eliminated regulatory risks.",
      author: "Michael Chen",
      role: "Operations Director",
      company: "Microfinance Institution",
    },
    {
      quote:
        "Our members love the transparency and speed. Loan approvals that took days now take hours.",
      author: "Emily Rodriguez",
      role: "VP of Technology",
      company: "Community Credit Union",
    },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Workflow className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Built for Your Industry
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Flexible architecture that adapts to diverse lending models and
            regulatory requirements across different industries.
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-green-100 py-20 px-4 sm:px-6 lg:px-8">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
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
                className="bg-gradient-dark text-white border-0 shadow-card"
              >
                <CardContent className="p-8">
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-muted-foreground">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
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
