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

const initialState: ThemeState = {
  mode: (localStorage.getItem('theme-mode') as ThemeMode) || 'system',
  isDark: false,
};

initialState.isDark = getInitialIsDark(initialState.mode);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.isDark = getInitialIsDark(action.payload);
      
      // Persist to localStorage
      localStorage.setItem('theme-mode', action.payload);
      
      // Update document class
      if (state.isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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
      const mode = (localStorage.getItem('theme-mode') as ThemeMode) || 'system';
      state.mode = mode;
      state.isDark = getInitialIsDark(mode);
      applyThemeClass(state.isDark);
    },
  },
});

const applyThemeClass = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

export const { setThemeMode, setSystemTheme, initializeTheme } = themeSlice.actions;
export default themeSlice.reducer;
