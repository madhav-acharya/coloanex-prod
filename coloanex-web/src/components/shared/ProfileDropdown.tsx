import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  CreditCard,
  Wallet,
} from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import {
  useListMySubscriptionsQuery,
  useListPlansQuery,
} from "@/apis/subscriptionsApi";
import { formatGasPaymentMode } from "@/utils/blockchainAccess";

export function ProfileDropdown() {
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

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto rounded-xl px-2 py-1.5 hover:bg-muted/70 cursor-pointer border border-transparent hover:border-border/60"
        >
          <Avatar className="w-9 h-9 ring-2 ring-primary/20">
            <AvatarImage src={user.profileImage} alt={user.fullName} />
            <AvatarFallback className="bg-green-600 text-white font-medium">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left pr-1">
            <p className="text-sm font-semibold leading-tight truncate">
              {user.fullName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {user.email}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground/80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 p-2 z-1000 rounded-xl border border-border/70 shadow-xl"
      >
        <div className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={user.profileImage} alt={user.fullName} />
              <AvatarFallback className="bg-green-600 text-white font-medium">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gas Mode</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-600 dark:text-blue-300">
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
          className="cursor-pointer rounded-md"
          onClick={() => navigate("/profile")}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-md"
          onClick={() => navigate("/settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        {isFreePlan && (
          <DropdownMenuItem
            className="cursor-pointer rounded-md text-primary focus:text-primary"
            onClick={() => navigate("/pricing")}
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
                className="cursor-pointer rounded-md"
                onClick={() =>
                  navigate(`/pricing?planCode=${encodeURIComponent(plan.code)}`)
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
          className="cursor-pointer rounded-md text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
