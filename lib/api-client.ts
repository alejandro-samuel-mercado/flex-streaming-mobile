import { Storage, StorageKeys } from './storage';
import { API_ORIGIN } from './api-routes';

/**
 * Authenticated fetch wrapper for the API.
 */
export async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await Storage.get(StorageKeys.ACCESS_TOKEN);
  const profileId = await Storage.get(StorageKeys.PROFILE_ID);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (profileId) {
    headers['X-Profile-Id'] = profileId;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      // Auto-logout on unauthorized
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
