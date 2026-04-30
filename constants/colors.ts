export type ThemeColors = {
  primary: string;
  danger: string;
  black: string;
  dark: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  success: string;
  warning: string;
  overlay: string;
  trustLow: string;
  trustMed: string;
  trustHigh: string;
  severityCritical: string;
  severityHigh: string;
  severityMedium: string;
  severityLow: string;
};

export const darkTheme: ThemeColors = {
  primary: '#003087',
  danger: '#D21034',
  black: '#0A0E1A',
  dark: '#141829',
  surface: '#1E2235',
  border: '#2A3050',
  text: '#FFFFFF',
  textMuted: '#8892B0',
  textSecondary: '#A8B2D8',
  success: '#22C55E',
  warning: '#F59E0B',
  overlay: 'rgba(10, 14, 26, 0.85)',
  trustLow: '#EF4444',
  trustMed: '#F59E0B',
  trustHigh: '#22C55E',
  severityCritical: '#FF0000',
  severityHigh: '#FF4500',
  severityMedium: '#FF8C00',
  severityLow: '#FFD700',
};

export const lightTheme: ThemeColors = {
  primary: '#003087',
  danger: '#D21034',
  black: '#F4F6FB',
  dark: '#FFFFFF',
  surface: '#EAECF5',
  border: '#CDD1E8',
  text: '#0A0E1A',
  textMuted: '#5A6480',
  textSecondary: '#3A3F60',
  success: '#22C55E',
  warning: '#F59E0B',
  overlay: 'rgba(244, 246, 251, 0.92)',
  trustLow: '#EF4444',
  trustMed: '#F59E0B',
  trustHigh: '#22C55E',
  severityCritical: '#FF0000',
  severityHigh: '#FF4500',
  severityMedium: '#FF8C00',
  severityLow: '#B8860B',
};

// Legacy alias — points to darkTheme; kept for static module-level constants
export const Colors = darkTheme;
