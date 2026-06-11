import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, BackHandler, ToastAndroid, Platform, TouchableHighlight } from 'react-native';
import { useRouter, usePathname, useGlobalSearchParams } from 'expo-router';
import { Home, Compass, Heart, User, Search, History, Film, Tv, Flame } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

// Fallback for TVFocusGuideView to fix compile errors but maintain functionality
const TVFocusGuide = (require('react-native') as any).TVFocusGuideView || View;

const NAV_ITEMS = [
    { name: 'Inicio', icon: Home, route: '/' },
    { name: 'Explorar', icon: Compass, route: '/explore' },
    { name: 'Películas', icon: Film, route: '/explore?type=MOVIE', isExplore: true, paramType: 'MOVIE' },
    { name: 'Series', icon: Tv, route: '/explore?type=SERIES', isExplore: true, paramType: 'SERIES' },
    { name: 'Estrenos', icon: Flame, route: '/explore?sort=recent', isExplore: true, paramSort: 'recent' },
    { name: 'Favoritos', icon: Heart, route: '/favorites' },
    { name: 'Historial', icon: History, route: '/history' },
    { name: 'Perfil', icon: User, route: '/profile' },
];

export default function TVSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useGlobalSearchParams();
    const [isSidebarFocused, setIsSidebarFocused] = useState(false);
    const focusCount = useRef(0);
    const lastBackPress = useRef(0);
    const collapseTimer = useRef<any>(null);

    // Tab-level routes where back = "press again to exit"
    const TAB_ROUTES = ['/', '/index', '/explore', '/favorites', '/profile', '/history'];

    // Back button handling
    useFocusEffect(
        useCallback(() => {
            const onBack = () => {
                if (isSidebarFocused) {
                    setIsSidebarFocused(false);
                    focusCount.current = 0;
                    if (collapseTimer.current) clearTimeout(collapseTimer.current);
                    return true;
                }

                // On tab-level routes, double-back to exit
                if (TAB_ROUTES.includes(pathname)) {
                    const now = Date.now();
                    if (now - lastBackPress.current < 2000) {
                        BackHandler.exitApp();
                        return true;
                    }
                    lastBackPress.current = now;
                    if (Platform.OS === 'android') {
                        ToastAndroid.show('Presiona atrás de nuevo para salir', ToastAndroid.SHORT);
                    }
                    return true;
                }

                return false;
            };
            const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
            return () => sub.remove();
        }, [isSidebarFocused, pathname])
    );

    const handleFocus = () => {
        focusCount.current += 1;
        if (collapseTimer.current) {
            clearTimeout(collapseTimer.current);
            collapseTimer.current = null;
        }
        if (!isSidebarFocused) {
            setIsSidebarFocused(true);
        }
    };

    const handleBlur = () => {
        focusCount.current -= 1;
        if (focusCount.current < 0) focusCount.current = 0;
        
        if (collapseTimer.current) clearTimeout(collapseTimer.current);
        collapseTimer.current = setTimeout(() => {
            if (focusCount.current <= 0) {
                focusCount.current = 0;
                setIsSidebarFocused(false);
            }
            collapseTimer.current = null;
        }, 1000);
    };

    const handleNavigate = (route: string) => {
        if (collapseTimer.current) { clearTimeout(collapseTimer.current); collapseTimer.current = null; }
        router.push(route as any);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        width: withTiming(isSidebarFocused ? 280 : 70, { duration: 200 }),
    }));

    return (
        <View style={styles.absoluteWrapper}>
            <Animated.View style={[styles.sidebar, animatedStyle]}>
                <View style={styles.container}>
                {NAV_ITEMS.map((item) => {
                    let isActive = false;
                    if (item.isExplore) {
                        if (pathname === '/explore') {
                            if (item.paramType) isActive = searchParams.type === item.paramType;
                            else if (item.paramSort) isActive = !searchParams.type && searchParams.sort === item.paramSort;
                        }
                    } else if (item.route === '/explore') {
                        isActive = pathname === '/explore' && !searchParams.type && !searchParams.sort;
                    } else {
                        isActive = pathname === item.route || (item.route === '/' && pathname === '/index');
                    }
                    return (
                        <SidebarItem
                            key={item.name}
                            item={item}
                            isActive={isActive}
                            onPress={() => handleNavigate(item.route)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            isSidebarFocused={isSidebarFocused}
                        />
                    );
                })}
                </View>
                <TVFocusGuide destinations={[]} style={styles.guide} />
            </Animated.View>
        </View>
    );
}

function SidebarItem({ item, isActive, onPress, onFocus, onBlur, isSidebarFocused }: any) {
    const [isFocused, setIsFocused] = useState(false);
    const Icon = item.icon;
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[{ width: '100%' }, animatedStyle]}>
            <TouchableHighlight
                focusable={true}
                onPress={onPress}
                onFocus={() => { setIsFocused(true); scale.value = withTiming(1.1, { duration: 150 }); onFocus(); }}
                onBlur={() => { setIsFocused(false); scale.value = withTiming(1, { duration: 150 }); onBlur(); }}
                underlayColor={Colors.white}
                style={[
                    styles.itemBtn,
                    isFocused && styles.itemFocused,
                    isActive && !isFocused && styles.itemActive
                ]}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <View style={styles.iconWrap}>
                        <Icon size={isFocused ? 28 : 24} color={isFocused ? Colors.white : (isActive ? Colors.primary : 'rgba(255,255,255,0.5)')} />
                    </View>
                    {isSidebarFocused && (
                        <Text style={[styles.label, isActive && styles.labelActive, isFocused && styles.labelFocused]} numberOfLines={1}>
                            {item.name}
                        </Text>
                    )}
                </View>
            </TouchableHighlight>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    absoluteWrapper: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 9999,
    },
    guide: {
        position: 'absolute',
        right: -1,
        top: 0,
        bottom: 0,
        width: 1,
    },
    sidebar: {
        height: '100%',
        backgroundColor: 'rgba(10, 10, 15, 0.98)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
        paddingTop: 20,
        paddingBottom: 20,
    },
    container: {
        flex: 1,
        justifyContent: 'space-evenly',
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    itemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        width: '100%',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    itemFocused: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderColor: Colors.white,
        borderWidth: 4,
    },
    itemActive: {
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
    },
    iconWrap: {
        width: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
    },
    labelActive: {
        color: Colors.white,
    },
    labelFocused: {
        color: Colors.white,
    },
});
