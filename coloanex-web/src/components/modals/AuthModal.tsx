import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const navigate = useNavigate();

  const handleMethodSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/10 shadow-2xl z-[200]">
        <DialogHeader className="space-y-3">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <img src="/images/logo.png" alt="Coloanex" className="w-7 h-7" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center tracking-tight">
            Welcome to Coloanex
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground/80">
            Select your preferred method to continue to your secure lending workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-6">
          <button
            onClick={() => handleMethodSelect("/login")}
            className="group relative flex items-center gap-4 w-full p-4 rounded-2xl border border-border/10 bg-muted/30 hover:bg-muted/50 hover:border-primary/20 transition-all duration-300 text-left overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-sm">Login with Email</h4>
              <p className="text-xs text-muted-foreground">Access with your standard credentials</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => {}}
            className="group relative flex items-center gap-4 w-full p-4 rounded-2xl border border-border/10 bg-muted/30 hover:bg-muted/50 hover:border-primary/20 transition-all duration-300 text-left overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
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
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-sm">Continue with Google</h4>
              <p className="text-xs text-muted-foreground">Quick access with your Google account</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Enterprise Security</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Instant Access</span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
          Don't have an account?{" "}
          <button
            onClick={() => handleMethodSelect("/signup")}
            className="text-primary hover:underline font-bold transition-all cursor-pointer"
          >
            Create your institutional account
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};
