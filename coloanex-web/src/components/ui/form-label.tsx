import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}

export function FormLabel({
  required,
  optional,
  children,
  className,
  ...props
}: FormLabelProps) {
  return (
    <Label className={cn("flex items-center gap-1", className)} {...props}>
      {children}
      {required && <span className="text-destructive text-sm">*</span>}
      {optional && !required && (
        <span className="text-muted-foreground text-xs">(optional)</span>
      )}
    </Label>
  );
}
