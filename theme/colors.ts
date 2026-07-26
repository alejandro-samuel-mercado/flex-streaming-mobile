/**
 * Nuba Streaming — Futuristic Irregular Cyber Palette
 * Breathtaking Neon Fuschia, Cyber Mint & Deep Electric Violet.
 */
export const Colors = {
  // Backgrounds - Deep Cyber Violet / Dark Space
  bg: '#050214',
  bgDark: '#02010A',
  bgCard: '#0F0826',
  bgCardLight: 'rgba(24, 12, 56, 0.82)',
  bgOverlay: 'rgba(5, 2, 20, 0.75)',

  // Primary — Neon Cyber Magenta / Fuschia
  primary: '#D946EF',
  primaryDark: '#A21CAF',
  primaryGlow: 'rgba(217, 70, 239, 0.28)',
  primaryBorder: 'rgba(217, 70, 239, 0.45)',
  primarySoft: '#F0ABFC',

  // Accent — Electric Cyber Mint / Cyan
  accent: '#00FF9D',
  accentPink: '#FF007F',
  accentGradient: ['#D946EF', '#00FF9D'] as const,

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
  purple: '#8B5CF6',
  purpleBg: 'rgba(139, 92, 246, 0.15)',
  purpleBorder: 'rgba(139, 92, 246, 0.35)',

  // Misc
  black: '#000000',
  transparent: 'transparent',
  cardHover: 'rgba(255, 255, 255, 0.04)',
  skeleton: 'rgba(255, 255, 255, 0.07)',
} as const;

export type ColorName = keyof typeof Colors;
