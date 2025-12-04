import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AppDispatch, RootState } from "@/store";
import { loginUser, registerUser, clearError } from "@/store/slices/authSlice";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      if (isLogin) {
        await dispatch(
          loginUser({
            email: formData.email,
            password: formData.password,
          })
        ).unwrap();
      } else {
        await dispatch(
          registerUser({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            phone: formData.phone,
          })
        ).unwrap();
      }
    } catch (err) {
      console.error("Auth error:", err);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    dispatch(clearError());
    setFormData({
      email: "",
      password: "",
      fullName: "",
      phone: "",
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full filter blur-xl animate-float"></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full filter blur-xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/10 rounded-full filter blur-xl animate-pulse-slow"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
          <div className="mb-8">
            <Link to="/" className="flex items-center space-x-2 mb-8">
              <div className="text-white font-bold text-2xl">CoLoanEx</div>
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Welcome to the Future of
              <span className="text-blue-100"> Peer-to-Peer Lending</span>
            </h1>

            <p className="text-lg text-blue-100 mb-8 max-w-md">
              Join our innovative platform and experience seamless, secure, and
              transparent lending like never before.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Bank-Grade Security</h3>
                <p className="text-blue-100 text-sm">
                  Advanced encryption protects all your data
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Instant Matching</h3>
                <p className="text-blue-100 text-sm">
                  Smart algorithms connect you instantly
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Better Rates</h3>
                <p className="text-blue-100 text-sm">
                  Competitive rates for all users
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold">$50M+</div>
              <div className="text-blue-100 text-sm">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">25K+</div>
              <div className="text-blue-100 text-sm">Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">98%</div>
              <div className="text-blue-100 text-sm">Success</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Back to home
              </span>
            </Link>
            <div className="text-gradient font-bold text-xl mb-2">CoLoanEx</div>
            <p className="text-muted-foreground">
              Welcome back to the future of lending
            </p>
          </div>

          <Card className="form-container border-0 shadow-xl">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold">
                {isLogin ? "Welcome back" : "Create your account"}
              </CardTitle>
              <p className="text-muted-foreground">
                {isLogin
                  ? "Sign in to your CoLoanEx account"
                  : "Join thousands of satisfied users"}
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Registration Fields */}
                {!isLogin && (
                  <>
                    <div className="form-field">
                      <label className="form-label">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          className="pl-10"
                          required={!isLogin}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                          className="pl-10"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email Field */}
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-field">
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full btn-primary"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {isLogin ? "Signing in..." : "Creating account..."}
                      </span>
                    </div>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Forgot Password */}
                {isLogin && (
                  <div className="text-center">
                    <a
                      href="#"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                )}
              </form>

              {/* Mode Switch */}
              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin
                    ? "Don't have an account?"
                    : "Already have an account?"}
                </p>
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  className="text-primary hover:underline font-medium mt-1"
                >
                  {isLogin ? "Create one now" : "Sign in instead"}
                </button>
              </div>

              {/* Terms */}
              {!isLogin && (
                <p className="text-xs text-muted-foreground text-center mt-6">
                  By creating an account, you agree to our{" "}
                  <a href="#" className="text-primary hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
