import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLogVisitMutation, useLogLeaveMutation } from "@/apis/authApi";

export const useActivityLog = () => {
  const { isAuthenticated } = useAuth();
  const [logVisit] = useLogVisitMutation();
  const [logLeave] = useLogLeaveMutation();

  useEffect(() => {
    if (!isAuthenticated) return;

    logVisit();

    let leaveTimeout: NodeJS.Timeout;

    const handleBeforeUnload = () => {
      navigator.sendBeacon("/api/auth/leave", JSON.stringify({}));
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        leaveTimeout = setTimeout(() => {
          logLeave();
        }, 5000);
      } else {
        if (leaveTimeout) clearTimeout(leaveTimeout);
        logVisit();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (leaveTimeout) clearTimeout(leaveTimeout);
    };
  }, [isAuthenticated, logVisit, logLeave]);
};
