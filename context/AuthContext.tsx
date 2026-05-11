import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Storage, StorageKeys } from '../lib/storage';
import { API_ROUTES } from '../lib/api-routes';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  profiles?: any[];
  endUserAccount?: {
    id: string;
    status: string;
    type: string;
    planId?: string | null;
    endDate: string | null;
    maxDevices: number;
    plan?: {
      id: string;
      name: string;
      durationDays: number;
      bonusDays?: number;
    };
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, userData?: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = await Storage.get(StorageKeys.ACCESS_TOKEN);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API_ROUTES.AUTH.ME, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success && result.data) {
        setUser(result.data);
        // Ensure profile ID is set and valid
        if (result.data.profiles?.length > 0) {
          const storedProfileId = await Storage.get(StorageKeys.PROFILE_ID);
          const isValidProfile = result.data.profiles.some((p: any) => p.id === storedProfileId);

          if (!storedProfileId || !isValidProfile) {
            await Storage.set(StorageKeys.PROFILE_ID, result.data.profiles[0].id);
          }
        }
      } else {
        await Storage.remove(StorageKeys.ACCESS_TOKEN);
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (accessToken: string, refreshToken: string, userData?: AuthUser) => {
    await Storage.set(StorageKeys.ACCESS_TOKEN, accessToken);
    await Storage.set(StorageKeys.REFRESH_TOKEN, refreshToken);

    if (userData) {
      setUser(userData);
      if (userData.profiles?.[0]) {
        await Storage.set(StorageKeys.PROFILE_ID, userData.profiles[0].id);
      }
      setLoading(false);
    } else {
      fetchUser();
    }
  };

  const logout = async () => {
    await Storage.multiRemove([
      StorageKeys.ACCESS_TOKEN,
      StorageKeys.REFRESH_TOKEN,
      StorageKeys.PROFILE_ID,
    ]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
