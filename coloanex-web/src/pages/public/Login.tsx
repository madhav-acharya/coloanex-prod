import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Wallet,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useRevealOnMount } from "@/hooks/useReveal";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import PublicLayout from "@/components/layouts/PublicLayout";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { isLoading, error, login } = useAuth();
  const ref = useRevealOnMount([isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      toast.success("Login successful!");
    } catch (err) {
      let errorMessage = "Login failed";
      if (
        err &&
        typeof err === "object" &&
        "data" in err &&
        err.data &&
        typeof err.data === "object" &&
        "message" in err.data
      ) {
        errorMessage =
          (err as { data: { message?: string } }).data.message ||
          "Login failed";
      }
      toast.error(errorMessage);
    }
  };

  return (
    <PublicLayout showHeader={false} showFooter={false}>
      <div className="relative min-h-[100svh] text-foreground">
        <div className="absolute top-4 right-4 z-30">
          <ThemeSwitcher />
        </div>

        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className="relative z-10 min-h-[100svh] grid lg:grid-cols-2"
        >
          <main className="relative flex items-center justify-center p-5 sm:p-8 md:p-12 order-2 lg:order-1">
            <div className="w-full max-w-md">
              <Link
                to="/"
                data-reveal
                className="inline-flex items-center gap-2 mb-8"
              >
                <img
                  src="/images/logo.png"
                  alt="CoLoanEx"
                  className="w-8 h-8"
                />
                <span className="font-[family-name:var(--font-headline)] text-2xl font-extrabold text-primary">
                  CoLoanEx
                </span>
              </Link>
              <h1
                data-reveal
                className="text-2xl md:text-3xl font-bold mb-2 text-foreground leading-snug"
              >
                Welcome back
              </h1>
              <p
                data-reveal
                className="text-sm text-muted-foreground mb-8 leading-relaxed"
              >
                Sign in to continue to your workspace.
              </p>

              <form
                data-reveal
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border/50 bg-card/90 p-5 sm:p-7 space-y-4"
              >
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                    {(error as { data?: { message?: string } })?.data
                      ?.message || "Login failed"}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground">
                    Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    className="h-11 rounded-xl"
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      className="h-11 rounded-xl pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl font-bold"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                  {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </form>

              <p data-reveal className="text-sm text-muted-foreground mt-6">
                No account?{" "}
                <button
                  type="button"
                  className="text-primary font-bold hover:underline"
                  onClick={() => navigate("/signup")}
                >
                  Create one
                </button>
              </p>
            </div>
          </main>

          <aside className="relative hidden lg:flex flex-col justify-center border-l border-border/40 p-8 xl:p-12 order-1 lg:order-2 min-h-[100svh]">
            <div className="relative z-10 max-w-md">
              <h2
                data-reveal
                className="text-3xl xl:text-4xl font-extrabold font-[family-name:var(--font-headline)] leading-snug mb-4"
              >
                Your lending workspace awaits
              </h2>
              <p
                data-reveal
                className="text-sm xl:text-base text-muted-foreground leading-relaxed mb-8"
              >
                Sign in to manage KYC, loans, contracts, repayments, and
                subscription-backed gas.
              </p>
              <ul data-reveal className="space-y-4">
                {[
                  {
                    icon: Building2,
                    title: "Institution desks",
                    desc: "Rules, applicants, and contracts in one tenant.",
                  },
                  {
                    icon: Wallet,
                    title: "Settlement control",
                    desc: "Platform or user wallet gas on web.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Secure sessions",
                    desc: "Role-scoped access on every protected route.",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="flex gap-3 rounded-xl border border-border/40 bg-card/80 p-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}
