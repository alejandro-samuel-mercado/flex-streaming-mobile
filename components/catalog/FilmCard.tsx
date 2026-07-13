import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { getContentTypeLabel } from '../../lib/content-types';
import { resolveImageUrl } from '../../lib/api-routes';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 12;
const CARD_W = (SW - 32 - GAP * (COLS - 1)) / COLS;

interface FilmCardProps {
    id: string;
    title: string;
    posterUrl: string | null;
    rating?: number;
    year?: number;
    type?: string;
    width?: number;
    progress?: number;
    duration?: number;
    onRemove?: () => void;
}

export default function FilmCard({ id, title, posterUrl, rating, year, type, width = CARD_W, progress, duration, onRemove }: FilmCardProps) {
    const router = useRouter();
    const [isFocused, setIsFocused] = useState(false);
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderColor: isFocused ? Colors.primary : 'rgba(255,255,255,0.08)',
        borderWidth: isFocused ? 2 : 1,
        shadowOpacity: glowOpacity.value,
        shadowColor: Colors.primary,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
    }));

    const handleFocus = () => {
        setIsFocused(true);
        scale.value = withSpring(1.05);
        glowOpacity.value = withSpring(0.5);
    };

    const handleBlur = () => {
        setIsFocused(false);
        scale.value = withSpring(1);
        glowOpacity.value = withSpring(0);
    };

    return (
        <Pressable
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPress={() => router.push(`/film/${id}` as any)}
            style={[s.container, { width }]}
        >
            <Animated.View style={[s.card, s.imageWrap, { width, height: width * 1.5 }, animatedStyle]}>
                <Image
                    source={resolveImageUrl(posterUrl)}
                    contentFit="cover"
                    transition={300}
                    style={s.image}
                />

                <LinearGradient
                    colors={['transparent', 'rgba(3,6,18,0.8)']}
                    style={s.overlay}
                />

                {!!onRemove && (
                    <TouchableOpacity 
                        style={s.removeBtn} 
                        onPress={() => onRemove()}
                    >
                        <X size={14} color={Colors.white} />
                    </TouchableOpacity>
                )}

                {!!(rating && rating > 0) && (
                    <View style={s.ratingBadge}>
                        <Star size={8} fill={Colors.rating} color={Colors.rating} />
                        <Text style={s.ratingText}>{rating.toFixed(1)}</Text>
                    </View>
                )}

                {!!(progress !== undefined && duration) && (
                    <View style={s.progressBar}>
                        <View style={[s.progressFill, { width: `${(progress / Math.max(duration, 1)) * 100}%` }]} />
                    </View>
                )}
            </Animated.View>

            <View style={s.info}>
                <Text style={s.title} numberOfLines={1}>{title}</Text>
                <View style={s.meta}>
                    {!!year && <Text style={s.metaText}>{year}</Text>}
                    {!!type && (
                        <View style={s.typeDotWrap}>
                            <View style={s.dot} />
                            <Text style={s.metaText}>{getContentTypeLabel(type)}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
}

const s = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    card: {
        width: '100%',
    },
    imageWrap: {
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.03)',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        height: '50%',
        top: '50%',
    },
    ratingBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(3,6,18,0.75)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,197,24,0.3)',
    },
    removeBtn: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(3,6,18,0.85)',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        zIndex: 10,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.white,
    },
    info: {
        marginTop: 8,
        paddingHorizontal: 2,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.white,
        letterSpacing: 0.2,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 3,
    },
    typeDotWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.primary,
        opacity: 0.5,
    },
    metaText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
});
