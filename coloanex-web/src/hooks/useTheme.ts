import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import type { RootState, AppDispatch } from "@/store";
import {
  setThemeMode,
  setSystemTheme,
  initializeTheme,
} from "@/store/slices/themeSlice";

export const useTheme = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { mode, isDark } = useSelector((state: RootState) => state.theme);

  useEffect(() => {
    // Initialize theme on mount
    dispatch(initializeTheme());

    // Listen to system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      dispatch(setSystemTheme(e.matches ? "dark" : "light"));
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [dispatch]);

  const setTheme = (newMode: "light" | "dark" | "system") => {
    dispatch(setThemeMode(newMode));
  };

  return {
    mode,
    isDark,
    setTheme,
  };
};
