import { LogOut, User, Settings, CreditCard, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useListMySubscriptionsQuery,
  useListPlansQuery,
} from "@/apis/subscriptionsApi";
import { formatGasPaymentMode } from "@/utils/blockchainAccess";
import { getRoles } from "@/lib/roleUtils";

export function ProfileDropdown({
  avatarOnly = false,
}: {
  avatarOnly?: boolean;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: mySubscriptions = [] } = useListMySubscriptionsQuery();
  const { data: plans = [] } = useListPlansQuery();

  const currentPlan =
    mySubscriptions.find((s) => s.scope === "USER" && s.status === "ACTIVE")
      ?.plan ||
    mySubscriptions.find((s) => s.scope === "TENANT" && s.status === "ACTIVE")
      ?.plan;
  const isFreePlan = !currentPlan || currentPlan.toLowerCase() === "free";
  const topPlans = plans.filter((plan) => plan.isActive).slice(0, 3);

  const location = useLocation();
  const basePath = location.pathname.startsWith("/borrower") ? "/borrower" : "";
  const isBorrowerContext = basePath === "/borrower";
  const { isBorrower } = getRoles(user);
  const avatarOnlyTrigger = avatarOnly || (isBorrowerContext && isBorrower);

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {avatarOnlyTrigger ? (
          <Button
            variant="ghost"
            className="h-auto rounded-xl p-1.5 bg-muted/40 hover:bg-muted/70 cursor-pointer border border-transparent hover:border-border/60"
            aria-label="Open profile menu"
          >
            <Avatar className="w-8 h-8 sm:w-9 sm:h-9 ring-2 ring-primary/20">
              <AvatarImage src={user.profileImage} alt={user.fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="h-auto rounded-xl px-2 py-1.5 bg-muted/50 hover:bg-muted/80 cursor-pointer border border-border/60"
            aria-label="Open profile menu"
          >
            <div className="flex items-center gap-2.5 min-w-0 max-w-[230px]">
              <Avatar className="w-8 h-8 ring-2 ring-primary/20 shrink-0">
                <AvatarImage src={user.profileImage} alt={user.fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left leading-tight">
                <p className="text-[11px] font-semibold tracking-tight truncate text-foreground/95">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-muted-foreground/90 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 sm:w-72 p-2 z-[220] rounded-xl border border-border/70 shadow-xl"
      >
        <div className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={user.profileImage} alt={user.fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-tight truncate text-foreground/95">
                {user.fullName}
              </p>
              <p className="text-[10px] text-muted-foreground/90 truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gas Mode</span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-info) 10%, transparent)",
                  color: "var(--color-info)",
                }}
              >
                <Wallet className="h-3 w-3" />
                {formatGasPaymentMode((user as any)?.gasPaymentMode)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Plan</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-semibold uppercase tracking-wide text-primary">
                <CreditCard className="h-3 w-3" />
                {(currentPlan || "FREE").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenuItem
          className="cursor-pointer rounded-md text-xs"
          onClick={() =>
            navigate(
              isBorrowerContext ? `${basePath}/profile` : `${basePath}/profile`,
            )
          }
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {!isBorrowerContext && (
          <DropdownMenuItem
            className="cursor-pointer rounded-md text-xs"
            onClick={() => navigate(`${basePath}/settings`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        {isFreePlan && (
          <DropdownMenuItem
            className="cursor-pointer rounded-md text-xs text-primary focus:text-primary"
            onClick={() => navigate(`${basePath}/pricing`)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Upgrade Plan</span>
          </DropdownMenuItem>
        )}
        {topPlans.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Quick Plans
              </p>
            </div>
            {topPlans.map((plan) => (
              <DropdownMenuItem
                key={plan.id}
                className="cursor-pointer rounded-md text-xs"
                onClick={() =>
                  navigate(
                    `${basePath}/pricing?planCode=${encodeURIComponent(plan.code)}`,
                  )
                }
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span className="flex-1">{plan.name}</span>
                <span className="text-xs text-muted-foreground">
                  {plan.currency} {Number(plan.price).toLocaleString()}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer rounded-md text-xs !text-red-500 hover:!bg-red-500/10 focus:!bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
