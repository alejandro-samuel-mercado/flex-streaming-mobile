import { Tabs } from 'expo-router';
import { Home, Compass, Heart, User } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from 'expo-router';

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            const lock = async () => {
                try {
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                } catch (e) {}
            };
            lock();
        }, [])
    );

    // Respect the safe area bottom inset (gesture bar / nav buttons)
    // On Android with hardware nav buttons, insets.bottom is 0, so we add a small base padding
    const bottomPadding = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 4 : 0);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: [
                    styles.tabBar,
                    { paddingBottom: bottomPadding, height: 58 + bottomPadding }
                ],
                tabBarItemStyle: {
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
                tabBarShowLabel: false,
                tabBarBackground: () => (
                    <View style={styles.blurContainer}>
                        <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
                    </View>
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Home size={focused ? 26 : 24} color={color} strokeWidth={focused ? 2.5 : 2} />
                            {focused && <View style={styles.indicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Compass size={focused ? 26 : 24} color={color} strokeWidth={focused ? 2.5 : 2} />
                            {focused && <View style={styles.indicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Heart size={focused ? 26 : 24} color={color} strokeWidth={focused ? 2.5 : 2} />
                            {focused && <View style={styles.indicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <User size={focused ? 26 : 24} color={color} strokeWidth={focused ? 2.5 : 2} />
                            {focused && <View style={styles.indicator} />}
                        </View>
                    ),
                }}
            />
            {/* Hidden Screens to persist tab bar */}
            <Tabs.Screen name="film/[id]" options={{ href: null }} />
            <Tabs.Screen name="search" options={{ href: null }} />
            <Tabs.Screen name="history" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
    },
    blurContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 14, 35, 0.88)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 229, 255, 0.14)',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: 60,
    },
    indicator: {
        position: 'absolute',
        bottom: -8,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },
});
