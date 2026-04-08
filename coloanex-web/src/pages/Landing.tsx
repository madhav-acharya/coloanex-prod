import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Shield, Database, Users, Mail, Phone } from "lucide-react";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Link } from "react-router-dom";

export default function Landing() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  const openAuthModal = () => {
    setAuthModalOpen(true);
  };

  return (
    <PublicLayout showFooter={false}>
      {/* Main Content */}
      <div className="bg-primary/10 dark:bg-primary/5 h-[calc(100vh-3.5rem)] overflow-hidden grid md:grid-cols-2">
        {/* Left Side - Content */}
        <div className="flex-col hidden sm:block justify-center px-8 md:px-16 lg:px-24 py-12 bg-background">
          ;
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Streamline Your Loan Operations
          </h1>
          <p className="text-lg text-muted-foreground mb-8 hidden md:block leading-relaxed">
            Comprehensive loan management, KYC verification, and secure document
            exchange for modern lending institutions.
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Enterprise Security
                </h3>
                <p className="text-sm text-muted-foreground">
                  Multi-factor authentication & role-based access
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Data Integrity
                </h3>
                <p className="text-sm text-muted-foreground">
                  Audit trails & compliance reporting
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Team Collaboration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Real-time updates & notifications
                </p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 hidden md:block gap-3 text-sm text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-muted">
              ISO 17025 Compliant
            </span>
            <span className="px-3 py-1 rounded-full bg-muted">
              21 CFR Part 11
            </span>
            <span className="px-3 py-1 rounded-full bg-muted">GDPR Ready</span>
          </div>
        </div>

        {/* Right Side - Auth Card */}
        <div className="flex items-center justify-center px-8 bg-muted/30">
          <Card className="w-full max-w-md border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-center mb-2">
                Welcome to Coloanex
              </h2>
              <p className="text-center text-muted-foreground mb-8">
                Join thousands of institutions worldwide using our comprehensive
                loan management solution.
              </p>

              <Button
                variant="default"
                size="lg"
                className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white"
                onClick={openAuthModal}
              >
                Get Started
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={openAuthModal}
              >
                Sign In
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-6">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auth Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to Coloanex</DialogTitle>
            <DialogDescription>
              Choose your preferred sign-in method
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <button
              onClick={() => {
                setAuthModalOpen(false);
                navigate("/login");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Use Email & Password</span>
            </button>

            <button
              onClick={() => setAuthModalOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Use Email & OTP</span>
            </button>

            <button
              onClick={() => setAuthModalOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Use Phone & OTP</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>

            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="font-medium">Continue with Apple</span>
            </button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              By continuing, you agree to our{" "}
              <Link
                to="/"
                className="text-primary hover:underline cursor-pointer"
              >
                Terms of Service
              </Link>
              and acknowledge that you have read our{" "}
              <Link
                to="#"
                className="text-primary hover:underline cursor-pointer"
              >
                Privacy Policy
              </Link>
            </p>

            <p className="text-center text-sm mt-4">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setAuthModalOpen(false);
                  navigate("/signup");
                }}
                className="text-green-600 hover:underline font-semibold cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
