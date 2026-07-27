import { Tabs } from 'expo-router';
import { Home, Search, Bookmark, User, Sparkles } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from 'expo-router';
import { scale } from '../../lib/responsive';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useNavVisibility } from '../../lib/nav-state';

function AnimatedBottomTabBar(props: any) {
    const navVisible = useNavVisibility();
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: (1 - navVisible.value) * 130 }],
            opacity: navVisible.value,
        };
    });
    return (
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 999 }, animatedStyle]}>
            <BottomTabBar {...props} />
        </Animated.View>
    );
}

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

    // Slightly elevated bottom margin (+4px) over the previous value
    const bottomMargin = Math.max(insets.bottom + 4, Platform.OS === 'android' ? 26 : 28);

    return (
        <Tabs
            tabBar={(props) => <AnimatedBottomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarStyle: [
                    styles.tabBar,
                    {
                        bottom: bottomMargin,
                        paddingBottom: 0,
                        paddingTop: 0,
                    }
                ],
                tabBarItemStyle: {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingTop: 0,
                    paddingBottom: 0,
                    marginVertical: 0,
                },
                tabBarIconStyle: {
                    flex: 1,
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 0,
                    marginBottom: 0,
                },
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.45)',
                tabBarShowLabel: false,
                // Super fast static background optimized for low-end devices (no heavy real-time BlurView!)
                tabBarBackground: () => (
                    <View style={styles.dockContainer}>
                        <LinearGradient
                            colors={['#1A0C38', '#0A041A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                        {/* Glowing top accent strip */}
                        <View style={styles.topAccentStrip}>
                            <LinearGradient
                                colors={['transparent', '#00FF9D', '#00D4FF', 'transparent']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                        </View>
                    </View>
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activePod]}>
                            {focused && <View style={styles.activeGlowDot} />}
                            <Home size={focused ? 22 : 20} color={focused ? '#FFFFFF' : color} strokeWidth={focused ? 2.6 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activePod]}>
                            {focused && <View style={styles.activeGlowDot} />}
                            <Search size={focused ? 22 : 20} color={focused ? '#FFFFFF' : color} strokeWidth={focused ? 2.6 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="my-nuba"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activePod]}>
                            {focused && <View style={styles.activeGlowDot} />}
                            <Bookmark size={focused ? 22 : 20} color={focused ? '#FFFFFF' : color} strokeWidth={focused ? 2.6 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activePod]}>
                            {focused && <View style={styles.activeGlowDot} />}
                            <User size={focused ? 22 : 20} color={focused ? '#FFFFFF' : color} strokeWidth={focused ? 2.6 : 2} />
                        </View>
                    ),
                }}
            />
            {/* Hidden Screens */}
            <Tabs.Screen name="favorites" options={{ href: null }} />
            <Tabs.Screen name="film/[id]" options={{ href: null }} />
            <Tabs.Screen name="search" options={{ href: null }} />
            <Tabs.Screen name="history" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        height: 68,
        // Irregular asymmetrical cyber geometry restored per user request
        borderTopLeftRadius: 34,
        borderBottomRightRadius: 34,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 12,
        shadowColor: '#00D4FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
    },
    dockContainer: {
        ...StyleSheet.absoluteFillObject,
        borderTopLeftRadius: 34,
        borderBottomRightRadius: 34,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#00D4FF',
    },
    topAccentStrip: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        height: 3,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        width: 46,
        position: 'relative',
        borderRadius: 20,
    },
    activePod: {
        backgroundColor: '#00D4FF',
        shadowColor: '#00D4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 6,
        transform: [{ scale: 1.05 }],
    },
    activeGlowDot: {
        position: 'absolute',
        top: 4,
        right: 10,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#00FF9D',
    },
});
