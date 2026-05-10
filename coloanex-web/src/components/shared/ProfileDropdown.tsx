import { LogOut, Settings, CreditCard, Wallet, User } from "lucide-react";
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
  showDetails = false,
}: {
  avatarOnly?: boolean;
  showDetails?: boolean;
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
  const avatarOnlyTrigger =
    avatarOnly || (!showDetails && isBorrowerContext && isBorrower);

  const roleLabel = (() => {
    const roleNames =
      user?.roles?.map((role) => role.role?.name).filter(Boolean) || [];
    if (roleNames.length === 0) return "User";
    const priority = ["Super Admin", "Admin", "Lender", "Borrower"];
    const preferred = priority.find((name) =>
      roleNames.some((role) => role.toLowerCase() === name.toLowerCase()),
    );
    return preferred || roleNames[0];
  })();

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
            className="h-auto rounded-xl p-1 hover:bg-muted/30 cursor-pointer border-none bg-transparent active:scale-95 transition-all"
            aria-label="Open profile menu"
          >
            <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
              <AvatarImage src={user.profileImage} alt={user.fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="h-auto rounded-xl px-2 py-1.5 hover:bg-muted/30 cursor-pointer border-none bg-transparent active:scale-95 transition-all"
            aria-label="Open profile menu"
          >
            <div className="flex items-center gap-2.5 min-w-0 max-w-[230px]">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={user.profileImage} alt={user.fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left leading-tight hidden sm:block">
                <p className="text-[11px] font-bold tracking-tight truncate text-foreground/90">
                  {user.fullName}
                </p>
                {roleLabel && (
                  <span className="inline-block bg-primary/15 text-primary text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-sm mt-0.5">
                    {roleLabel}
                  </span>
                )}
              </div>
            </div>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 sm:w-72 p-2 z-[220] rounded-xl border border-border shadow-none bg-popover/95 backdrop-blur-xl"
      >
        <div className="rounded-xl bg-primary/10 p-3 mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={user.profileImage} alt={user.fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight truncate text-foreground">
                {user.fullName}
              </p>
              {roleLabel && (
                <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-[10px] font-black tracking-widest px-2 py-1 rounded mt-1.5">
                  {roleLabel}
                </span>
              )}
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
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-semibold tracking-wide text-primary">
                <CreditCard className="h-3 w-3" />
                {(currentPlan || "Free")}
              </span>
            </div>
          </div>
        </div>
        {isBorrowerContext ? (
          <DropdownMenuItem
            className="cursor-pointer rounded-md text-xs"
            onClick={() => navigate(`${basePath}/profile`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Account</span>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              className="cursor-pointer rounded-md text-xs"
              onClick={() => navigate(`${basePath}/profile`)}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-md text-xs"
              onClick={() => navigate(`${basePath}/settings`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </>
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
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
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
