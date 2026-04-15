import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { Eye, EyeOff } from "lucide-react";
import { RootState } from "@/store";
import { setAuth } from "@/store/slices/authSlice";
import { useRegisterMutation } from "@/apis/authApi";
import { toast } from "sonner";
import Landing from "./Landing";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "lender",
    tenantName: "",
    tenantContactEmail: "",
    tenantContactPhone: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [register, { isLoading, error }] = useRegisterMutation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await register(formData).unwrap();

      localStorage.setItem("token", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("sessionId", response.sessionId);

      dispatch(setAuth({ token: response.accessToken }));

      toast.success("Registration successful!");
      navigate("/dashboard");
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

  const handleClose = () => {
    navigate("/");
  };

  return (
    <>
      <Landing />
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              Create Your Account
            </DialogTitle>
            <DialogDescription className="text-center">
              Join Coloanex to manage your loan operations
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {"data" in error &&
                typeof error.data === "object" &&
                "message" in error.data
                  ? (error.data as { message?: string }).message ||
                    "Registration failed"
                  : "Registration failed"}
              </div>
            )}

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
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone (Optional)</label>
              <Input
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            {formData.role === "lender" && (
              <>
                <div className="pt-2 border-t">
                  <h3 className="text-sm font-semibold mb-3">
                    Lender Organization Information
                  </h3>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Organization Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    name="tenantName"
                    placeholder="Enter organization name"
                    value={formData.tenantName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Organization Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    name="tenantContactEmail"
                    placeholder="organization@example.com"
                    value={formData.tenantContactEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Organization Phone <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="tel"
                    name="tenantContactPhone"
                    placeholder="Organization phone number"
                    value={formData.tenantContactPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
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

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-center text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Log in
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Signup;
