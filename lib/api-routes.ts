/**
 * API Routes — Mobile version.
 * Ported from the web's api-routes.ts, removing all window/document references.
 * Uses a static API_BASE_URL from env or hardcoded default.
 */

// In Expo, environment variables must be prefixed with EXPO_PUBLIC_
// For now, hardcode the production URL and allow override
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-streamflex.unixxtech.online/api';

// Robust calculation of API_ORIGIN: remove the trailing /api or /api/ safely
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const API_ROUTES = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/login`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    ME: `${API_BASE_URL}/auth/me`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  },
  PROFILES: {
    LIST: `${API_BASE_URL}/profiles`,
    CREATE: `${API_BASE_URL}/profiles`,
    UPDATE: (id: string) => `${API_BASE_URL}/profiles/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/profiles/${id}`,
    VERIFY_PIN: (id: string) => `${API_BASE_URL}/profiles/${id}/verify-pin`,
  },
  CONTENT: {
    BASE: `${API_BASE_URL}/content`,
    LIST: `${API_BASE_URL}/content`,
    DETAIL: (id: string) => `${API_BASE_URL}/content/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/content/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/content/${id}`,
    FEATURED: `${API_BASE_URL}/content/featured`,
    TRENDING: `${API_BASE_URL}/content/trending`,
    RECENT: `${API_BASE_URL}/content/recent`,
    RELATED: (id: string) => `${API_BASE_URL}/content/${id}/related`,
  },
  ACTORS: {
    LIST: `${API_BASE_URL}/actors`,
    DETAIL: (id: string) => `${API_BASE_URL}/actors/${id}`,
  },
  CATEGORIES: {
    GENRES: `${API_BASE_URL}/categories/genres`,
    AGE_RATINGS: `${API_BASE_URL}/categories/age-ratings`,
    TAGS: `${API_BASE_URL}/categories/tags`,
    CONTENT_TYPES: `${API_BASE_URL}/categories/content-types`,
  },
  PLATFORMS: {
    LIST: `${API_BASE_URL}/platforms`,
    DETAIL: (slug: string) => `${API_BASE_URL}/platforms/${slug}`,
  },
  SEARCH: {
    SEARCH: `${API_BASE_URL}/search`,
    SUGGEST: `${API_BASE_URL}/search/suggest`,
  },
  STREAM: {
    REQUEST_ACCESS: `${API_BASE_URL}/stream/request-access`,
  },
  FAVORITES: {
    BASE: `${API_BASE_URL}/favorites`,
    LIST: `${API_BASE_URL}/favorites`,
    TOGGLE: `${API_BASE_URL}/favorites/toggle`,
  },
  LIKES: {
    BASE: `${API_BASE_URL}/likes`,
    TOGGLE: `${API_BASE_URL}/likes/toggle`,
    CHECK: (id: string) => `${API_BASE_URL}/likes/check/${id}`,
  },
  HISTORY: {
    BASE: `${API_BASE_URL}/history`,
    LIST: `${API_BASE_URL}/history`,
    CONTINUE: `${API_BASE_URL}/history/continue`,
    PROGRESS: `${API_BASE_URL}/history/progress`,
  },
  REVIEWS: {
    BY_CONTENT: (contentId: string) => `${API_BASE_URL}/reviews/content/${contentId}`,
    CREATE: `${API_BASE_URL}/reviews`,
  },
  PLANS: {
    LIST: `${API_BASE_URL}/plans`,
  },
  HOMEPAGE: {
    DATA: `${API_BASE_URL}/homepage`,
  },
  REQUESTS: {
    BASE: `${API_BASE_URL}/requests`,
    TMDB_SEARCH: `${API_BASE_URL}/requests/tmdb-search`,
    DB_SEARCH: `${API_BASE_URL}/requests/db-search`,
  },
} as const;

/**
 * Resolve a media URL (thumbnails, posters, etc.) to a full URL.
 */
export const resolveImageUrl = (url: string | null | undefined): string => {
  if (!url) return 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=60&w=400&auto=format&fit=crop';
  if (url.startsWith('http')) return url;

  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return `${API_ORIGIN}${normalizedUrl}`;
};
