import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, ThemeColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';

export interface Theme extends ThemeColors {
  isDark: boolean;
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const { mode } = useThemeStore();

  const resolved =
    mode === 'dark' ? darkTheme
    : mode === 'light' ? lightTheme
    : systemScheme === 'light' ? lightTheme
    : darkTheme;

  return { ...resolved, isDark: resolved === darkTheme };
}
