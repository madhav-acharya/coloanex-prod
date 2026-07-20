import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Building2,
  UserSquare2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  BadgeCheck,
  Layers,
  Zap,
} from "lucide-react";
import { setAuth, setUser } from "@/store/slices/authSlice";
import { useRegisterMutation } from "@/apis/authApi";
import { toast } from "sonner";
import { getHomeRoute } from "@/lib/roleUtils";
import { FileUploader } from "@/components/shared/FileUploader";
import type { UploadedFile } from "@/types/upload";
import { useRevealOnMount } from "@/hooks/useReveal";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import PublicLayout from "@/components/layouts/PublicLayout";
import { cn } from "@/lib/utils";

export default function Signup() {
  const readSavedFormData = () => {
    try {
      const raw = sessionStorage.getItem("signup_form_data");
      if (!raw) return null;
      return JSON.parse(raw) as Partial<{
        fullName: string;
        email: string;
        phone: string;
        password: string;
        role: string;
        tenantName: string;
        tenantContactEmail: string;
        tenantContactPhone: string;
        tenantLogo: string;
      }>;
    } catch {
      return null;
    }
  };

  const savedFormData = readSavedFormData();
  const [step, setStep] = useState(() => {
    const saved = Number(sessionStorage.getItem("signup_step"));
    return saved >= 1 && saved <= 3 ? saved : 1;
  });
  const [formData, setFormData] = useState({
    fullName: savedFormData?.fullName || "",
    email: savedFormData?.email || "",
    phone: savedFormData?.phone || "",
    password: savedFormData?.password || "",
    role: savedFormData?.role || "lender",
    tenantName: savedFormData?.tenantName || "",
    tenantContactEmail: savedFormData?.tenantContactEmail || "",
    tenantContactPhone: savedFormData?.tenantContactPhone || "",
    tenantLogo: savedFormData?.tenantLogo || "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading, error }] = useRegisterMutation();
  const ref = useRevealOnMount([step]);

  const tenantLogoFiles: UploadedFile[] = formData.tenantLogo
    ? [
        {
          url: formData.tenantLogo,
          fileName: "tenant-logo",
          mimeType: "image/*",
          sizeInBytes: 0,
        },
      ]
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    sessionStorage.setItem("signup_step", String(step));
  }, [step]);

  useEffect(() => {
    sessionStorage.setItem("signup_form_data", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (formData.role !== "lender" && step === 3) {
      setStep(2);
    }
  }, [formData.role, step]);

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!formData.fullName || !formData.email || !formData.password) {
        toast.error("Please fill in all required personal details.");
        return;
      }
      if (formData.role === "lender") {
        setStep(3);
      } else {
        submitForm();
      }
    }
  };

  const submitForm = async () => {
    try {
      const response = await register(formData).unwrap();
      localStorage.setItem("token", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("sessionId", response.sessionId);
      dispatch(setAuth({ token: response.accessToken }));
      sessionStorage.removeItem("signup_step");
      sessionStorage.removeItem("signup_form_data");
      if (response.user) {
        dispatch(setUser(response.user));
        navigate(getHomeRoute(response.user));
      } else {
        navigate("/dashboard");
      }
      toast.success("Registration successful!");
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      toast.error(apiError?.data?.message || "Registration failed");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.role === "lender" && step === 2) {
      handleNextStep();
      return;
    }
    submitForm();
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
            <div className="w-full max-w-xl">
              <Link
                to="/"
                data-reveal
                className="inline-flex items-center gap-2 mb-6"
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
                className="text-2xl md:text-3xl font-bold mb-1 leading-snug"
              >
                {step === 1 && "Choose your role"}
                {step === 2 && "Personal details"}
                {step === 3 && "Organization setup"}
              </h1>
              <p
                data-reveal
                className="text-sm text-muted-foreground mb-6 leading-relaxed"
              >
                {step === 1 && "Select how you will use the platform"}
                {step === 2 && "Tell us about yourself"}
                {step === 3 && "Configure your lending organization"}
              </p>

              <form
                data-reveal
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border/50 bg-card/90 p-5 sm:p-7 space-y-5"
              >
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
                    {"data" in error &&
                    typeof error.data === "object" &&
                    error.data &&
                    "message" in error.data
                      ? (error.data as { message?: string }).message ||
                        "Registration failed"
                      : "Registration failed"}
                  </div>
                )}

                <div className="flex justify-center gap-2">
                  {[1, 2, formData.role === "lender" ? 3 : null]
                    .filter(Boolean)
                    .map((dotStep) => (
                      <div
                        key={String(dotStep)}
                        className={cn(
                          "h-2 rounded-full transition-all",
                          step === dotStep
                            ? "w-8 bg-primary"
                            : "w-2 bg-primary/25",
                        )}
                      />
                    ))}
                </div>

                {step === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        {
                          role: "lender",
                          title: "Lender",
                          desc: "Manage capital, applicants, and lending ops.",
                          icon: Building2,
                        },
                        {
                          role: "borrower",
                          title: "Borrower",
                          desc: "Apply, repay, and track your loans.",
                          icon: UserSquare2,
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, role: opt.role }))
                        }
                        className={cn(
                          "rounded-2xl border-2 p-5 text-left transition-all",
                          formData.role === opt.role
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/40",
                        )}
                      >
                        <div
                          className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center mb-3",
                            formData.role === opt.role
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          <opt.icon className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-foreground">{opt.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {opt.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        Full name *
                      </label>
                      <Input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        Email *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        Phone
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        Password *
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          className="h-11 rounded-xl pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        Organization name *
                      </label>
                      <Input
                        type="text"
                        name="tenantName"
                        value={formData.tenantName}
                        onChange={handleInputChange}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        Organization email *
                      </label>
                      <Input
                        type="email"
                        name="tenantContactEmail"
                        value={formData.tenantContactEmail}
                        onChange={handleInputChange}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        Organization phone *
                      </label>
                      <Input
                        type="tel"
                        name="tenantContactPhone"
                        value={formData.tenantContactPhone}
                        onChange={handleInputChange}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <FileUploader
                      label="Organization logo"
                      accept="image"
                      maxFiles={1}
                      value={tenantLogoFiles}
                      onChange={(files) =>
                        setFormData((prev) => ({
                          ...prev,
                          tenantLogo: files[0]?.url || "",
                        }))
                      }
                      folder="tenant"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      className="flex-1 rounded-xl h-11"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                  {step === 1 && (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full rounded-xl h-11 font-bold"
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                  {step === 2 && formData.role === "lender" && (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-[2] rounded-xl h-11 font-bold"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                  {(step === 3 ||
                    (step === 2 && formData.role !== "lender")) && (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] rounded-xl h-11 font-bold"
                    >
                      {isLoading ? "Creating..." : "Create account"}
                      {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
                    </Button>
                  )}
                </div>

                {step === 1 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-primary font-bold hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </form>
            </div>
          </main>

          <aside className="relative hidden lg:flex flex-col justify-center border-l border-border/40 p-8 xl:p-12 order-1 lg:order-2 min-h-[100svh]">
            <div className="relative z-10 max-w-md">
              <h2
                data-reveal
                className="text-3xl xl:text-4xl font-extrabold font-[family-name:var(--font-headline)] leading-snug mb-4"
              >
                Start in minutes
              </h2>
              <p
                data-reveal
                className="text-sm xl:text-base text-muted-foreground leading-relaxed mb-8"
              >
                Create a lender institution or borrower account and go live on
                the same protocol.
              </p>
              <ul data-reveal className="space-y-4">
                {[
                  {
                    icon: Layers,
                    title: "Role-based onboarding",
                    desc: "Lender org setup or borrower-ready profile.",
                  },
                  {
                    icon: BadgeCheck,
                    title: "KYC-ready path",
                    desc: "Documents and verification after signup.",
                  },
                  {
                    icon: Zap,
                    title: "Gas-ready plans",
                    desc: "Subscribe when you need platform sponsorship.",
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
