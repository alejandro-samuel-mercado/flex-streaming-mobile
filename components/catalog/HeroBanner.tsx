import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    Dimensions,
    ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Play, Star, Sparkles, Plus } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { getContentTypeLabel } from '../../lib/content-types';
import { isTV, scale, UI_SPACING } from '../../lib/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HeroSlide {
    id: string; title: string; description: string; backdropUrl: string;
    rating?: number | null; year?: number | null; duration?: number | null;
    ageRating?: string; type?: string; genres?: string[]; hasVideo?: boolean;
}

export default function HeroBanner({ slides }: { slides: HeroSlide[] }) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);
    const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index != null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    // Auto-scroll banner every 5 seconds
    useEffect(() => {
        if (slides.length <= 1) return;
        autoScrollTimer.current = setInterval(() => {
            setCurrentIndex(prev => {
                const next = (prev + 1) % slides.length;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, 5000);
        return () => { if (autoScrollTimer.current) clearInterval(autoScrollTimer.current); };
    }, [slides.length]);

    if (slides.length === 0) return null;

    const renderSlide = ({ item }: { item: HeroSlide }) => (
        <View style={s.slide}>
            <Image source={item.backdropUrl} style={s.bgImage} contentFit="cover" transition={500} />

            <LinearGradient colors={['rgba(3,6,18,0.2)', 'rgba(3,6,18,0.5)', Colors.bg]} locations={[0, 0.4, 0.9]} style={s.gradient} />
            <LinearGradient colors={['rgba(3,6,18,0.7)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.6, y: 0.5 }} style={s.sideGradient} />

            <View style={s.content}>

                <View style={s.badgeRow}>
                    {!!item.type && (
                        <View style={s.typeBadge}>
                            <Sparkles size={10} color={Colors.primarySoft} />
                            <Text style={s.typeBadgeText}>{getContentTypeLabel(item.type)}</Text>
                        </View>
                    )}
                    {item.genres?.slice(0, 2).map((g, i) => (
                        <View key={i} style={s.genreBadge}><Text style={s.genreBadgeText}>{g}</Text></View>
                    ))}
                </View>

                <Text style={s.title} numberOfLines={2}>{item.title}</Text>

                <View style={s.metaRow}>
                    {!!(item.rating && item.rating > 0) && (
                        <View style={s.ratingBadge}>
                            <Star size={12} fill={Colors.rating} color={Colors.rating} />
                            <Text style={s.ratingText}>{item.rating.toFixed(1)}</Text>
                        </View>
                    )}
                    <Text style={s.metaText}>{item.year}</Text>
                    {!!item.ageRating && <View style={s.ageBadge}><Text style={s.ageText}>{item.ageRating}</Text></View>}
                </View>

                <Text style={s.description} numberOfLines={2}>{item.description}</Text>

                <View style={s.actions}>
                    <TVButton
                        style={[s.playBtn, item.hasVideo === false && s.playBtnDisabled]}
                        onPress={() => router.push(`/film/${item.id}` as any)}
                    >
                        <Play size={18} fill={item.hasVideo === false ? Colors.textMuted : Colors.black} color={item.hasVideo === false ? Colors.textMuted : Colors.black} />
                        <Text style={[s.playBtnText, item.hasVideo === false && { color: Colors.textMuted }]}>
                            {item.hasVideo === false ? 'Próximamente' : 'Reproducir'}
                        </Text>
                    </TVButton>
                    <TVButton style={s.plusBtn} onPress={() => router.push(`/film/${item.id}` as any)}>
                        <Plus size={20} color={Colors.white} />
                    </TVButton>
                </View>
            </View>
        </View>
    );

    return (
        <View style={s.container}>
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            />

            <View style={s.dots}>
                {slides.map((_, i) => (
                    <View key={i} style={[s.dot, i === currentIndex && s.dotActive]} />
                ))}
            </View>
        </View>
    );
}

function TVButton({ children, onPress, style }: { children: React.ReactNode, onPress: () => void, style?: any }) {
    const [isFocused, setIsFocused] = useState(false);
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderWidth: isFocused ? 2 : (style?.borderWidth || 0),
        borderColor: isFocused ? Colors.primary : (style?.borderColor || 'transparent'),
    }));
    return (
        <Pressable
            onFocus={() => { setIsFocused(true); scale.value = withSpring(1.1); }}
            onBlur={() => { setIsFocused(false); scale.value = withSpring(1); }}
            onPress={onPress}
        >
            <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
        </Pressable>
    );
}

const HERO_H = SCREEN_HEIGHT * 0.5;
const s = StyleSheet.create({
    container: { height: HERO_H, position: 'relative', backgroundColor: Colors.bgDark },
    slide: { width: SCREEN_WIDTH, height: HERO_H },
    bgImage: { ...StyleSheet.absoluteFillObject },
    gradient: { ...StyleSheet.absoluteFillObject },
    sideGradient: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%' },
    content: { position: 'absolute', bottom: 40, left: 20, right: 20 },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    typeBadgeText: { fontSize: scale(9), fontWeight: '900', color: Colors.primarySoft, letterSpacing: 1.5, textTransform: 'uppercase' },
    genreBadge: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    genreBadgeText: { fontSize: scale(10), fontWeight: '700', color: Colors.textSecondary },
    title: { fontSize: scale(38, 1.8), fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: -1.5, lineHeight: scale(40, 1.8), marginBottom: scale(12) },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: scale(12), marginBottom: scale(14) },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,197,24,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,197,24,0.2)' },
    ratingText: { fontSize: 12, fontWeight: '900', color: Colors.rating },
    metaText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
    ageBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    ageText: { fontSize: 10, fontWeight: '800', color: Colors.white },
    description: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22, marginBottom: 20 },
    actions: { flexDirection: 'row', gap: 12 },
    playBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    playBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 },
    playBtnText: { fontSize: 14, fontWeight: '900', color: Colors.black, textTransform: 'uppercase', letterSpacing: 1 },
    plusBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    dots: { position: 'absolute', bottom: 12, left: 20, flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
    dotActive: { width: 20, backgroundColor: Colors.primary },
});
