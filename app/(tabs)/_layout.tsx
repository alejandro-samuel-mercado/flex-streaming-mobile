import { Tabs } from 'expo-router';
import { Home, Compass, Heart, User } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

import { useEffect, useCallback } from 'react';
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

    // Calculate bottom padding based on safe area - reduced for better fit
    const bottomPadding = insets.bottom > 0 ? Math.max(insets.bottom, 12) : 12;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: [
                    styles.tabBar,
                    { bottom: bottomPadding }
                ],
                tabBarItemStyle: {
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
                tabBarShowLabel: false,
                tabBarBackground: () => (
                    <View style={styles.blurContainer}>
                        <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
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
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 0,
        height: 64,
        marginHorizontal: 12,
        width: width - 24,
        borderRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    blurContainer: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: 'rgba(15, 20, 45, 0.95)',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 229, 255, 0.25)', // Slight primary color glow
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: 60,
    },
    indicator: {
        position: 'absolute',
        bottom: -12,
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
