import { toast as sonnerToast } from "sonner";

export const useToast = () => {
  const toast = ({
    title,
    description,
    variant = "default",
  }: {
    title: string;
    description?: string;
    variant?: "default" | "destructive" | "success" | "warning" | "info";
  }) => {
    switch (variant) {
      case "destructive":
        sonnerToast.error(title, {
          description,
          style: {
            background: "rgb(220, 38, 38)",
            color: "white",
            border: "1px solid rgb(185, 28, 28)",
          },
        });
        break;
      case "success":
        sonnerToast.success(title, {
          description,
          style: {
            background: "rgb(34, 197, 94)",
            color: "white",
            border: "1px solid rgb(21, 128, 61)",
          },
        });
        break;
      case "warning":
        sonnerToast.warning(title, {
          description,
          style: {
            background: "rgb(245, 158, 11)",
            color: "white",
            border: "1px solid rgb(217, 119, 6)",
          },
        });
        break;
      case "info":
        sonnerToast.info(title, {
          description,
          style: {
            background: "rgb(59, 130, 246)",
            color: "white",
            border: "1px solid rgb(37, 99, 235)",
          },
        });
        break;
      default:
        sonnerToast.success(title, {
          description,
          style: {
            background: "rgb(34, 197, 94)",
            color: "white",
            border: "1px solid rgb(21, 128, 61)",
          },
        });
        break;
    }
  };

  return { toast };
};
