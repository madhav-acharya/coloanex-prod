import { Lock } from "lucide-react";

interface PermissionRequiredProps {
  requiredPermission?: string;
}

export const PermissionRequired = ({ requiredPermission }: PermissionRequiredProps) => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Permission Required
        </h2>
        <p className="text-muted-foreground mb-4">
          You don't have permission to access this page.
        </p>
        {requiredPermission && (
          <p className="text-sm text-muted-foreground">
            Required permission:{" "}
            <code className="bg-muted px-2 py-1 rounded">
              {requiredPermission}
            </code>
          </p>
        )}
      </div>
    </div>
  );
};
