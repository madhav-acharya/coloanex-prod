import { toast as sonnerToast } from "sonner";
import React from "react";
import { 
  CircleCheck, 
  Info, 
  TriangleAlert, 
  OctagonX, 
  Trash2, 
  Upload, 
  RefreshCw, 
  Undo2,
  CheckCircle2,
  XCircle
} from "lucide-react";

export const useToast = () => {
  const toast = ({
    title,
    description,
    variant = "default",
    action,
    retry,
    undo,
    icon,
    duration = 4000,
  }: {
    title: string;
    description?: string;
    variant?: "default" | "destructive" | "success" | "warning" | "info" | "delete" | "upload" | "update";
    action?: {
      label: string;
      onClick: () => void;
    };
    retry?: {
      label?: string;
      onClick: () => void;
    };
    undo?: {
      label?: string;
      onClick: () => void;
    };
    icon?: React.ReactNode;
    duration?: number;
  }) => {
    // Smart Icon Detection based on title keywords and variant
    const getIcon = () => {
      if (icon) return icon;
      
      const lowerTitle = title.toLowerCase();
      
      if (variant === "delete" || lowerTitle.includes("delete") || lowerTitle.includes("remove")) {
        return <Trash2 className="size-5 text-destructive" />;
      }
      if (variant === "upload" || lowerTitle.includes("upload") || lowerTitle.includes("import")) {
        return <Upload className="size-5 text-blue-500" />;
      }
      if (variant === "update" || lowerTitle.includes("update") || lowerTitle.includes("change") || lowerTitle.includes("edit")) {
        return <RefreshCw className="size-5 text-amber-500" />;
      }
      if (variant === "success" || lowerTitle.includes("success") || lowerTitle.includes("complete") || lowerTitle.includes("finish")) {
        return <CheckCircle2 className="size-5 text-emerald-500" />;
      }
      if (variant === "destructive" || lowerTitle.includes("fail") || lowerTitle.includes("error")) {
        return <XCircle className="size-5 text-destructive" />;
      }
      if (variant === "warning" || lowerTitle.includes("warn") || lowerTitle.includes("caution")) {
        return <TriangleAlert className="size-5 text-amber-500" />;
      }
      
      // Defaults based on variant
      const defaultIcons = {
        success: <CheckCircle2 className="size-5 text-emerald-500" />,
        destructive: <XCircle className="size-5 text-destructive" />,
        warning: <TriangleAlert className="size-5 text-amber-500" />,
        info: <Info className="size-5 text-blue-500" />,
        default: <Info className="size-5 text-primary" />,
      };
      
      return (defaultIcons as any)[variant] || defaultIcons.default;
    };

    const toastOptions: any = {
      description,
      duration,
      icon: getIcon(),
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undo ? {
        label: undo.label || "Undo",
        onClick: undo.onClick,
      } : retry ? {
        label: retry.label || "Retry",
        onClick: retry.onClick,
      } : undefined,
    };

    // Correctly map to sonner variants for styling
    if (variant === "destructive" || variant === "delete") {
      sonnerToast.error(title, toastOptions);
    } else if (variant === "success") {
      sonnerToast.success(title, toastOptions);
    } else if (variant === "warning" || variant === "update") {
      sonnerToast.warning(title, toastOptions);
    } else if (variant === "info" || variant === "upload") {
      sonnerToast.info(title, toastOptions);
    } else {
      sonnerToast(title, toastOptions);
    }
  };

  return { toast };
};
