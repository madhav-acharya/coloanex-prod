import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}

const getSystemColorScheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const getInitialIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'system') {
    return getSystemColorScheme() === 'dark';
  }
  return mode === 'dark';
};

const applyThemeClass = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

const getInitialMode = (): ThemeMode => {
  if (typeof localStorage !== 'undefined') {
    return (localStorage.getItem('theme-mode') as ThemeMode) || 'system';
  }
  return 'system';
};

const initialMode = getInitialMode();
const initialIsDark = getInitialIsDark(initialMode);

// Apply theme immediately on script load to prevent flash
applyThemeClass(initialIsDark);

const initialState: ThemeState = {
  mode: initialMode,
  isDark: initialIsDark,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.isDark = getInitialIsDark(action.payload);
      
      // Persist to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme-mode', action.payload);
      }
      
      // Update document class
      applyThemeClass(state.isDark);
    },
    setSystemTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      // Only react to system theme changes if we are in 'system' mode
      if (state.mode === 'system') {
        const nextIsDark = action.payload === 'dark';
        if (state.isDark !== nextIsDark) {
          state.isDark = nextIsDark;
          applyThemeClass(state.isDark);
        }
      }
    },
    initializeTheme: (state) => {
      const mode = getInitialMode();
      state.mode = mode;
      state.isDark = getInitialIsDark(mode);
      applyThemeClass(state.isDark);
    },
  },
});

export const { setThemeMode, setSystemTheme, initializeTheme } = themeSlice.actions;
export default themeSlice.reducer;
