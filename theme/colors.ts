/**
 * Nuba Streaming — Color palette
 * Matches the web CSS custom properties exactly.
 */
export const Colors = {
  // Backgrounds
  bg: '#030612',
  bgDark: '#02040A',
  bgCard: '#0A0F24',
  bgCardLight: 'rgba(15, 21, 50, 0.8)',
  bgOverlay: 'rgba(3, 6, 18, 0.7)',

  // Primary — Cyan Neon
  primary: '#00E5FF',
  primaryDark: '#0099AA',
  primaryGlow: 'rgba(0, 229, 255, 0.15)',
  primaryBorder: 'rgba(0, 229, 255, 0.3)',
  primarySoft: '#4DEDFF',

  // Accent — Orange / Pink
  accent: '#FF6B00',
  accentPink: '#FF0055',
  accentGradient: ['#FF6B00', '#FF0055'] as const,

  // Text
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#d1d5db',
  textGray: '#9ca3af',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  textDark: 'rgba(255, 255, 255, 0.35)',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderCyan: 'rgba(0, 229, 255, 0.3)',
  borderCyanStrong: 'rgba(0, 229, 255, 0.4)',

  // Semantic
  rating: '#f5c518',
  ratingBg: 'rgba(245, 197, 24, 0.1)',
  ratingBorder: 'rgba(245, 197, 24, 0.2)',
  success: '#22c55e',
  error: '#ef4444',
  errorSoft: '#fca5a5',
  warning: '#eab308',
  purple: '#a855f7',
  purpleBg: 'rgba(168, 85, 247, 0.1)',
  purpleBorder: 'rgba(168, 85, 247, 0.25)',

  // Misc
  black: '#000000',
  transparent: 'transparent',
  cardHover: 'rgba(255, 255, 255, 0.02)',
  skeleton: 'rgba(255, 255, 255, 0.05)',
} as const;

export type ColorName = keyof typeof Colors;
