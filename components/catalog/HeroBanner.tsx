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
import { scale } from '../../lib/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HeroSlide {
    id: string; title: string; description: string; backdropUrl: string | null; posterUrl?: string | null;
    rating?: number | null; year?: number | null; duration?: number | null;
    ageRating?: string; type?: string; genres?: string[]; hasVideo?: boolean;
}

export default function HeroBanner({ slides }: { slides: HeroSlide[] }) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index != null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    useEffect(() => {
        if (slides.length <= 1) return;
        autoScrollTimer.current = setInterval(() => {
            setCurrentIndex(prev => {
                const next = (prev + 1) % slides.length;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, 6000);
        return () => { if (autoScrollTimer.current) clearInterval(autoScrollTimer.current); };
    }, [slides.length]);

    if (slides.length === 0) return null;

    const renderSlide = useCallback(({ item }: { item: HeroSlide }) => {
        // Use posterUrl (portada) or backdropUrl
        const bgSource = item.posterUrl || item.backdropUrl || null;
        const resolvedUrl = typeof bgSource === 'string' ? bgSource : ((bgSource as any)?.uri || null);
        return (
            <View style={s.slide}>
                <Image 
                    source={resolvedUrl ? { uri: resolvedUrl } : null} 
                    style={s.bgImage} 
                    contentFit="cover" 
                    transition={150} 
                    cachePolicy="memory-disk"
                    priority="high"
                    recyclingKey={item.id}
                />

                {/* Extremely light bottom gradient only, so the portada is 100% visible and bright! */}
                <LinearGradient 
                    colors={['transparent', 'rgba(3, 8, 24, 0.4)', '#030818']} 
                    locations={[0, 0.75, 1]} 
                    style={s.gradient} 
                />

                {/* Compact bottom HUD area: buttons on the left, badges on the bottom right */}
                <View style={s.content}>
                    <View style={s.actions}>
                        <CyberButton
                            style={[s.playBtn, item.hasVideo === false && s.playBtnDisabled]}
                            onPress={() => router.push(`/film/${item.id}` as any)}
                            glow={item.hasVideo !== false}
                        >
                            <Play size={20} fill={item.hasVideo === false ? 'rgba(255,255,255,0.4)' : '#030818'} color={item.hasVideo === false ? 'rgba(255,255,255,0.4)' : '#030818'} />
                            <Text style={[s.playBtnText, item.hasVideo !== false && { color: '#030818', fontWeight: '900' }]}>
                                {item.hasVideo === false ? 'Próximamente' : 'Play'}
                            </Text>
                        </CyberButton>
                        
                        <CyberButton style={s.plusBtn} onPress={() => router.push(`/film/${item.id}` as any)}>
                            <Plus size={22} color="#FFFFFF" />
                        </CyberButton>
                    </View>

                    {/* Tags moved to the bottom right */}
                    <View style={s.bottomRightBadges}>
                        {!!item.type && (
                            <View style={s.typeBadge}>
                                <Sparkles size={10} color="rgba(0, 255, 157, 0.75)" />
                                <Text style={s.typeBadgeText}>{getContentTypeLabel(item.type)}</Text>
                            </View>
                        )}
                        {!!(item.rating && item.rating > 0) && (
                            <View style={s.ratingBadge}>
                                <Star size={10} fill="rgba(250, 204, 21, 0.75)" color="rgba(250, 204, 21, 0.75)" />
                                <Text style={s.ratingText}>{item.rating.toFixed(1)}</Text>
                            </View>
                        )}
                        {!!item.year && <Text style={s.metaText}>{item.year}</Text>}
                       
                    </View>
                </View>
            </View>
        );
    }, [router]);

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
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={2}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            />

            <View style={s.dots}>
                {slides.map((_, i) => (
                    <View key={i} style={[s.dot, i === currentIndex && s.dotActive]} />
                ))}
            </View>
        </View>
    );
}

function CyberButton({ children, onPress, style, glow = false }: { children: React.ReactNode, onPress: () => void, style?: any, glow?: boolean }) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    return (
        <Pressable
            onPressIn={() => { scale.value = withSpring(0.93, { damping: 12 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
            onPress={onPress}
        >
            <Animated.View style={[style, glow && s.glowBtn, animatedStyle]}>{children}</Animated.View>
        </Pressable>
    );
}

// Taller hero banner occupying full image height as requested (was 0.64, now 0.80)
const HERO_H = SCREEN_HEIGHT * 0.75;

const s = StyleSheet.create({
    container: { height: HERO_H, position: 'relative', backgroundColor: '#030818', marginBottom: scale(28) },
    slide: { width: SCREEN_WIDTH, height: HERO_H },
    bgImage: { ...StyleSheet.absoluteFillObject },
    gradient: { ...StyleSheet.absoluteFillObject },
    content: { 
        position: 'absolute', 
        bottom: 35, 
        left: 30, 
        right: 30, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    bottomRightBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        flexWrap: 'wrap',
        flex: 1,
        marginLeft: 15,
    },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 255, 157, 0.04)', borderWidth: 0.8, borderColor: 'rgba(0, 255, 157, 0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    typeBadgeText: { fontSize: scale(9), fontWeight: '800', color: 'rgba(0, 255, 157, 0.75)', letterSpacing: 1, textTransform: 'uppercase' },
    genreBadge: { backgroundColor: 'rgba(0, 212, 255, 0.04)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 0.8, borderColor: 'rgba(0, 212, 255, 0.25)' },
    genreBadgeText: { fontSize: scale(8.5), fontWeight: '700', color: 'rgba(255, 255, 255, 0.75)' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(250, 204, 21, 0.04)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 0.8, borderColor: 'rgba(250, 204, 21, 0.25)' },
    ratingText: { fontSize: 11, fontWeight: '800', color: 'rgba(250, 204, 21, 0.75)' },
    metaText: { fontSize: 11, fontWeight: '700', color: 'rgba(255, 255, 255, 0.55)' },
    actions: { flexDirection: 'row', gap: 14, alignItems: 'center', flexWrap: 'wrap' },
    playBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 8, 
        paddingHorizontal: 22,
        height: 48,
        backgroundColor: '#00FF9D', 
        borderRadius: 16,
    },
    glowBtn: { shadowColor: '#00FF9D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },
    playBtnDisabled: { paddingHorizontal: 16, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', shadowOpacity: 0 },
    playBtnText: { 
        fontSize: scale(13), 
        fontWeight: '900', 
        color: '#030818', 
        textTransform: 'uppercase', 
        letterSpacing: 1,
    },
    plusBtn: { 
        width: 48, 
        height: 48, 
        borderRadius: 16, 
        backgroundColor: 'rgba(0, 212, 255, 0.12)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 1.2, 
        borderColor: 'rgba(0, 212, 255, 0.45)' 
    },
    dots: { position: 'absolute', bottom: 10, right: 16, flexDirection: 'row', gap: 5 },
    dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
    dotActive: { width: 18, backgroundColor: '#00FF9D', shadowColor: '#00FF9D', shadowRadius: 6, shadowOpacity: 1, elevation: 4 },
});
