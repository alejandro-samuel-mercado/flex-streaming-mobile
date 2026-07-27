/**
 * Nuba Streaming — Futuristic Irregular Cyber Palette
 * Breathtaking Neon Fuschia, Cyber Mint & Deep Electric Violet.
 */
export const Colors = {
  // Backgrounds - Deep Ocean Cyber Blue / Dark Space
  bg: '#030818',
  bgDark: '#01040D',
  bgCard: '#081026',
  bgCardLight: 'rgba(8, 16, 38, 0.82)',
  bgOverlay: 'rgba(3, 8, 24, 0.75)',

  // Primary — Electric Cyber Cyan / Sky Blue
  primary: '#00D4FF',
  primaryDark: '#0077FF',
  primaryGlow: 'rgba(0, 212, 255, 0.28)',
  primaryBorder: 'rgba(0, 212, 255, 0.45)',
  primarySoft: '#80E5FF',

  // Accent — Electric Cyber Mint / Cyan
  accent: '#00FF9D',
  accentPink: '#0088FF',
  accentGradient: ['#00D4FF', '#00FF9D'] as const,

  // Text
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textGray: '#A0AEC0',
  textMuted: 'rgba(255, 255, 255, 0.48)',
  textDark: 'rgba(255, 255, 255, 0.35)',

  // Borders
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.07)',
  borderCyan: 'rgba(0, 255, 157, 0.35)',
  borderCyanStrong: 'rgba(0, 255, 157, 0.55)',

  // Semantic
  rating: '#FACC15',
  ratingBg: 'rgba(250, 204, 21, 0.15)',
  ratingBorder: 'rgba(250, 204, 21, 0.35)',
  success: '#00FF9D',
  error: '#FF3366',
  errorSoft: '#FF80A0',
  warning: '#F59E0B',
  purple: '#0077FF',
  purpleBg: 'rgba(0, 119, 255, 0.15)',
  purpleBorder: 'rgba(0, 119, 255, 0.35)',

  // Misc
  black: '#000000',
  transparent: 'transparent',
  cardHover: 'rgba(255, 255, 255, 0.04)',
  skeleton: 'rgba(255, 255, 255, 0.07)',
} as const;

export type ColorName = keyof typeof Colors;
