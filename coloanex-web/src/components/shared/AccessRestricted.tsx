import { Lock } from "lucide-react";

export const AccessRestricted = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Access Restricted
        </h2>
        <p className="text-muted-foreground mb-4">
          Your account needs to be assigned to a tenant before you can access
          this page.
        </p>
        <p className="text-sm text-muted-foreground">
          Please contact a Super Admin to assign a tenant to your account.
        </p>
      </div>
    </div>
  );
};
