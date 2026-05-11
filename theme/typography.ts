import { TextStyle } from 'react-native';

/**
 * Typography scale for Nuba mobile.
 * Uses system fonts; the web uses Inter/system stack.
 */
export const Typography: Record<string, TextStyle> = {
  // Display
  heroTitle: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 42,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Headings
  h1: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '800',
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Body
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Caption / Labels
  caption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  badge: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Buttons
  buttonPrimary: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttonSecondary: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Special
  rating: {
    fontSize: 14,
    fontWeight: '900',
  },
  filmCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  filmCardMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
} as const;
