import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RootState, AppDispatch } from "@/store";
import {
  setThemeMode,
  setSystemTheme,
  initializeTheme,
} from "@/store/slices/themeSlice";

export const useTheme = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { mode, isDark, colors } = useSelector(
    (state: RootState) => state.theme,
  );

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem("theme-mode").then((savedMode) => {
      if (savedMode) {
        dispatch(initializeTheme(savedMode as "light" | "dark" | "system"));
      }
    });

    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      dispatch(setSystemTheme(colorScheme === "dark" ? "dark" : "light"));
    });

    return () => subscription.remove();
  }, [dispatch]);

  const setTheme = (newMode: "light" | "dark" | "system") => {
    dispatch(setThemeMode(newMode));
  };

  return {
    mode,
    isDark,
    colors,
    setTheme,
  };
};
