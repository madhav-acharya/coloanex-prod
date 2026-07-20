import { Link } from "react-router-dom";
import { PageShell } from "@/components/shared/PageShell";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/40 backdrop-blur-sm text-foreground py-12 md:py-16">
      <PageShell>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="sm:col-span-2">
            <Link
              to="/"
              className="font-[family-name:var(--font-headline)] text-2xl font-extrabold text-primary"
            >
              CoLoanEx
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">
              Lending OS for institutions — KYC, contracts, repayments, and
              on-chain settlement in one protocol.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Product
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/features" className="hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-primary">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-primary">
                  Security
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Account
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="hover:text-primary">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-primary">
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-border/40 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>© {new Date().getFullYear()} CoLoanEx</span>
          <span>Built for scalable credit operations</span>
        </div>
      </PageShell>
    </footer>
  );
}
