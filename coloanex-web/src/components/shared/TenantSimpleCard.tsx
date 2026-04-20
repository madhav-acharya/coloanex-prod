import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { Tenant } from "@/types/tenant";

interface TenantSimpleCardProps {
  tenant: Tenant;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
  narrow?: boolean;
}

export function TenantSimpleCard({
  tenant,
  onClick,
  className,
  compact = false,
  narrow = false,
}: TenantSimpleCardProps) {
  return (
    <Card
      className={[
        "border-border/30 bg-card cursor-pointer overflow-hidden w-full",
        narrow ? "max-w-[340px] mx-auto" : "",
        className || "",
      ].join(" ")}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div
          className={`relative w-full bg-gradient-to-br from-primary/15 via-primary/5 to-transparent ${compact ? "h-28" : "h-36"}`}
        >
          {tenant.logo ? (
            <img
              src={tenant.logo}
              alt={tenant.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className={compact ? "p-3 space-y-1.5" : "p-4 space-y-2.5"}>
          <p
            className={`${compact ? "text-[13px]" : "text-sm"} font-semibold text-foreground truncate`}
          >
            {tenant.name}
          </p>
          <p className="text-xs text-muted-foreground truncate inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {tenant.address || "Address not provided"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
