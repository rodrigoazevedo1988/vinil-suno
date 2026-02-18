import { Song } from '../types';

export interface ThemeColors {
  primary: string; // The main brand color (e.g., used for play buttons, accents)
  secondary: string; // A darker shade for gradients
  light: string; // A lighter shade for hover states
  backgroundGradient: string; // The background ambient gradient
}

// Helper to convert hex to RGB triplet for Tailwind opacity support
const hexToRgbTriplet = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
};

export const getTrackMood = (song: Song | null): ThemeColors => {
  // Default Vinil Suno "Wine Red" Theme
  const defaultTheme: ThemeColors = {
    primary: '#7B1E3A',
    light: '#9E2A4D',
    secondary: '#5A162B',
    backgroundGradient: 'linear-gradient(to bottom, rgba(123, 30, 58, 0.4), #050505)',
  };

  if (!song) {
    // Inject global CSS variables for the default theme as RGB
    document.documentElement.style.setProperty('--brand-primary-rgb', hexToRgbTriplet(defaultTheme.primary));
    document.documentElement.style.setProperty('--brand-light-rgb', hexToRgbTriplet(defaultTheme.light));
    document.documentElement.style.setProperty('--brand-secondary-rgb', hexToRgbTriplet(defaultTheme.secondary));
    return defaultTheme;
  }

  const { energy, valence } = song.mood;
  
  let baseColor = '#7B1E3A'; // Default

  if (energy > 0.7) {
    if (valence > 0.6) {
      baseColor = '#D97706'; // High Energy + Happy -> Amber/Orange
    } else if (valence < 0.4) {
      baseColor = '#7F1D1D'; // High Energy + Dark -> Deep Red
    } else {
      baseColor = '#9333EA'; // High Energy + Neutral -> Purple
    }
  } else if (energy < 0.4) {
    if (valence > 0.6) {
      baseColor = '#059669'; // Low Energy + Happy -> Emerald
    } else if (valence < 0.4) {
      baseColor = '#1E3A8A'; // Low Energy + Sad -> Dark Blue
    } else {
      baseColor = '#4B5563'; // Low Energy + Neutral -> Grey
    }
  } else {
    if (valence > 0.6) {
      baseColor = '#DB2777'; // Pink
    } else if (valence < 0.4) {
      baseColor = '#4C1D95'; // Indigo
    } else {
      baseColor = '#7B1E3A'; // Wine Red
    }
  }

  const palettes: Record<string, ThemeColors> = {
    '#D97706': { primary: '#D97706', light: '#F59E0B', secondary: '#92400E', backgroundGradient: 'radial-gradient(circle at 50% 0%, rgba(217, 119, 6, 0.25), transparent 70%)' },
    '#7F1D1D': { primary: '#991B1B', light: '#EF4444', secondary: '#7F1D1D', backgroundGradient: 'radial-gradient(circle at 50% 0%, rgba(153, 27, 27, 0.3), transparent 70%)' },
    '#9333EA': { primary: '#9333EA', light: '#A855F7', secondary: '#6B21A8', backgroundGradient: 'radial-gradient(circle at 50% 0%, rgba(147, 51, 234, 0.25), transparent 70%)' },
    '#059669': { primary: '#059669', light: '#10B981', secondary: '#065F46', backgroundGradient: 'radial-gradient(circle at 50% 0%, rgba(5, 150, 105, 0.2), transparent 70%)' },
    '#1E3A8A': { primary: '#2563EB', light: '#3B82F6', secondary: '#1E3A8A', backgroundGradient: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.25), transparent 70%)' },
    '#4B5563': { primary: '#52525b', light: '#71717a', secondary: '#27272a', backgroundGradient: 'radial-gradient(circle at 50% 0%, rgba(82, 82, 91, 0.2), transparent 70%)' },
    '#DB2777': { primary: '#DB2777', light: '#EC4899', secondary: '#9D174D', backgroundGradient: 'radial-gradient(circle at 50% 0%, rgba(219, 39, 119, 0.25), transparent 70%)' },
    '#4C1D95': { primary: '#6366F1', light: '#818CF8', secondary: '#312E81', backgroundGradient: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.25), transparent 70%)' },
    '#7B1E3A': defaultTheme
  };

  const theme = palettes[baseColor] || defaultTheme;
  
  // Inject global CSS variables as RGB triplets so Tailwind /opacity classes work
  document.documentElement.style.setProperty('--brand-primary-rgb', hexToRgbTriplet(theme.primary));
  document.documentElement.style.setProperty('--brand-light-rgb', hexToRgbTriplet(theme.light));
  document.documentElement.style.setProperty('--brand-secondary-rgb', hexToRgbTriplet(theme.secondary));

  return theme;
};