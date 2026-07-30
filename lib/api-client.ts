import { Storage, StorageKeys } from './storage';
import { API_BASE_URL } from './api-routes';

/**
 * Performs the token refresh using the stored refresh token.
 * Returns the new access token, or null if refresh fails.
 */
async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = await Storage.get(StorageKeys.REFRESH_TOKEN);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      // Persist the new token pair
      await Storage.set(StorageKeys.ACCESS_TOKEN, data.data.accessToken);
      if (data.data.refreshToken) {
        await Storage.set(StorageKeys.REFRESH_TOKEN, data.data.refreshToken);
      }
      return data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Authenticated fetch wrapper for the API.
 * Automatically refreshes the access token on 401 before giving up.
 */
export async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await Storage.get(StorageKeys.ACCESS_TOKEN);
  const profileId = await Storage.get(StorageKeys.PROFILE_ID);

  const buildHeaders = (accessToken: string | null): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(options.headers as Record<string, string> || {}),
    };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    if (profileId) headers['X-Profile-Id'] = profileId;
    return headers;
  };

  let res = await fetch(url, { ...options, headers: buildHeaders(token) });

  // On 401: attempt silent token refresh once before failing
  if (res.status === 401) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      // Retry the original request with the fresh token
      res = await fetch(url, { ...options, headers: buildHeaders(newToken) });
    }
  }

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      // Refresh also failed — clear all credentials so the user is sent to login
      await Storage.multiRemove([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.PROFILE_ID,
      ]);
    }
    throw new Error(data.error || `API Request failed with status ${res.status}`);
  }

  return data;
}
