import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { Colors } from '@/constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof Colors.light;
}

const getSystemColorScheme = (): 'light' | 'dark' => {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
};

const getInitialIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'system') {
    return getSystemColorScheme() === 'dark';
  }
  return mode === 'dark';
};

const initialState: ThemeState = {
  mode: 'system',
  isDark: getSystemColorScheme() === 'dark',
  colors: getSystemColorScheme() === 'dark' ? Colors.dark : Colors.light,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.isDark = getInitialIsDark(action.payload);
      state.colors = state.isDark ? Colors.dark : Colors.light;
      
      // Persist to AsyncStorage
      AsyncStorage.setItem('theme-mode', action.payload);
    },
    setSystemTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      if (state.mode === 'system') {
        state.isDark = action.payload === 'dark';
        state.colors = state.isDark ? Colors.dark : Colors.light;
      }
    },
    initializeTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.isDark = getInitialIsDark(action.payload);
      state.colors = state.isDark ? Colors.dark : Colors.light;
    },
  },
});

export const { setThemeMode, setSystemTheme, initializeTheme } = themeSlice.actions;
export default themeSlice.reducer;
