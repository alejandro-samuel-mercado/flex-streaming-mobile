'use client';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { checkForUpdate, UpdateInfo } from '../lib/update-checker';
import { UpdateModal } from '../components/ui/UpdateModal';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)' || (segments as string[]).includes('login') || pathname?.includes('login');

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, segments, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)' || (segments as string[]).includes('login') || pathname?.includes('login');
  if (!user && !inAuthGroup) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    // Delay 3s so the app finishes loading before checking for updates
    const timer = setTimeout(async () => {
      const info = await checkForUpdate('android');
      if (info) setUpdateInfo(info);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: Colors.bg }}>
        <AuthProvider>
          <AuthGuard>
            <View style={{ flex: 1, backgroundColor: Colors.bg }}>
              <StatusBar style="light" translucent backgroundColor="transparent" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.bg },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/login" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="watch/[id]" options={{ headerShown: false, animation: 'fade', orientation: 'landscape' }} />
              </Stack>

              {/* Update notification modal — shown 3s after launch if server has a newer APK */}
              {updateInfo && (
                <UpdateModal
                  updateInfo={updateInfo}
                  onDismiss={() => setUpdateInfo(null)}
                />
              )}
            </View>
          </AuthGuard>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

