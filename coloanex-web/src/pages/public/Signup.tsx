import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Building2, UserSquare2, ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import { setAuth, setUser } from "@/store/slices/authSlice";
import { useRegisterMutation } from "@/apis/authApi";
import { toast } from "sonner";
import Landing from "./Landing";
import { Card, CardContent } from "@/components/ui/card";
import { getHomeRoute } from "@/lib/roleUtils";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "lender", // default
    tenantName: "",
    tenantContactEmail: "",
    tenantContactPhone: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [register, { isLoading, error }] = useRegisterMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    navigate("/");
  };

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

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const submitForm = async () => {
    try {
      const response = await register(formData).unwrap();

      localStorage.setItem("token", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("sessionId", response.sessionId);

      dispatch(setAuth({ token: response.accessToken }));
      if (response.user) {
        dispatch(setUser(response.user));
        navigate(getHomeRoute(response.user));
      } else {
        navigate(formData.role === "borrower" ? "/borrower/dashboard" : "/dashboard");
      }

      toast.success("Registration successful!");
    } catch (err) {
      interface ApiError {
        data?: {
          message?: string;
        };
      }
      const apiError = err as ApiError;
      const errorMessage = apiError?.data?.message || "Registration failed";
      toast.error(errorMessage);
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
    <>
      <Landing />
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {step === 1 && "Choose Your Role"}
              {step === 2 && "Personal Details"}
              {step === 3 && "Organization Setup"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {step === 1 && "Select how you would like to use Coloanex"}
              {step === 2 && "Tell us a bit about yourself"}
              {step === 3 && "Set up your lending organization profile"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                {"data" in error &&
                typeof error.data === "object" &&
                "message" in error.data
                  ? (error.data as { message?: string }).message ||
                    "Registration failed"
                  : "Registration failed"}
              </div>
            )}

            {/* Stepper Dots */}
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, formData.role === "lender" ? 3 : null]
                .filter(Boolean)
                .map((dotStep) => (
                  <div
                    key={dotStep}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step === dotStep
                        ? "w-8 bg-primary"
                        : "w-2 bg-primary/20"
                    }`}
                  />
                ))}
            </div>

            {/* STEP 1: ROLE SELECTION */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  onClick={() => setFormData((prev) => ({ ...prev, role: "lender" }))}
                  className={`cursor-pointer transition-all border-2 overflow-hidden ${
                    formData.role === "lender"
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/20 scale-[1.02]"
                      : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <CardContent className="p-8 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className={`p-4 rounded-full transition-colors ${formData.role === "lender" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                      <Building2 size={36} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Lender</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Manage your capital, evaluate applicants, and streamline digital lending operations.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setFormData((prev) => ({ ...prev, role: "borrower" }))}
                  className={`cursor-pointer transition-all border-2 overflow-hidden ${
                    formData.role === "borrower"
                      ? "border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/20 scale-[1.02]"
                      : "border-border/50 hover:border-blue-500/50 hover:bg-muted/50"
                  }`}
                >
                  <CardContent className="p-8 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className={`p-4 rounded-full transition-colors ${formData.role === "borrower" ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-500"}`}>
                      <UserSquare2 size={36} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Borrower</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Seamlessly apply for loans, manage repayments, and track your history.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 2: PERSONAL DETAILS */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required={step === 2}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required={step === 2}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone (Optional)</label>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Enter your contact number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={step === 2}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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

            {/* STEP 3: TENANT INFO (LENDERS ONLY) */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="rounded-md bg-muted/50 p-4 mb-4">
                  <p className="text-xs text-muted-foreground">
                    As a Lender, you'll operate under an organization umbrella. Let's get your main tenant configured.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Organization Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    name="tenantName"
                    placeholder="E.g., Global Finance Corp"
                    value={formData.tenantName}
                    onChange={handleInputChange}
                    required={step === 3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Organization Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    name="tenantContactEmail"
                    placeholder="contact@organization.com"
                    value={formData.tenantContactEmail}
                    onChange={handleInputChange}
                    required={step === 3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Organization Phone <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="tel"
                    name="tenantContactPhone"
                    placeholder="Support or main office line"
                    value={formData.tenantContactPhone}
                    onChange={handleInputChange}
                    required={step === 3}
                  />
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-4 border-t">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackStep}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {step === 1 && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {step === 2 && formData.role === "lender" && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-[2] bg-primary hover:bg-primary/90"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {(step === 3 || (step === 2 && formData.role !== "lender")) && (
                <Button
                  type="submit"
                  className={step > 1 ? "flex-[2] bg-primary hover:bg-primary/90" : "w-full bg-primary hover:bg-primary/90"}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                  {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              )}
            </div>

            {step === 1 && (
              <p className="text-center text-sm pt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Signup;
