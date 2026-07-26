import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
    const glowOpacity = useSharedValue(0.15);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderColor: isFocused ? Colors.primary : 'rgba(0, 229, 255, 0.25)',
        borderWidth: isFocused ? 2 : 1.2,
        shadowOpacity: glowOpacity.value,
        shadowColor: Colors.primary,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
    }));

    const handleFocus = () => {
        setIsFocused(true);
        scale.value = withSpring(1.04, { damping: 12 });
        glowOpacity.value = withSpring(0.6);
    };

    const handleBlur = () => {
        setIsFocused(false);
        scale.value = withSpring(1, { damping: 12 });
        glowOpacity.value = withSpring(0.15);
    };

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { damping: 12 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(isFocused ? 1.04 : 1, { damping: 12 });
    };

    return (
        <View style={[s.container, { width }]}>
            <Pressable
                onFocus={handleFocus}
                onBlur={handleBlur}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => router.push(`/film/${id}` as any)}
                style={s.card}
            >
                <Animated.View style={[s.imageWrap, { width, height: width * 1.5 }, animatedStyle]}>
                    <Image
                        source={resolveImageUrl(posterUrl)}
                        contentFit="cover"
                        transition={300}
                        style={s.image}
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(10,14,35,0.4)', 'rgba(3,6,18,0.92)']}
                        locations={[0.4, 0.7, 1]}
                        style={s.overlay}
                    />

                    {!!(rating && rating > 0) && (
                        <View style={s.ratingBadge}>
                            <Star size={10} fill={Colors.rating} color={Colors.rating} />
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

            {!!onRemove && (
                <TouchableOpacity 
                    style={s.removeBtn} 
                    onPress={onRemove}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <X size={14} color={Colors.white} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: 18,
    },
    card: {
        width: '100%',
    },
    imageWrap: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(15,21,50,0.5)',
        position: 'relative',
        elevation: 6,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    ratingBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(10, 14, 35, 0.85)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(245, 197, 24, 0.4)',
    },
    removeBtn: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: 'rgba(220, 38, 38, 0.95)',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        zIndex: 999,
        elevation: 10,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.rating,
    },
    info: {
        marginTop: 8,
        paddingHorizontal: 2,
    },
    title: {
        fontSize: 13,
        fontWeight: '800',
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
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowRadius: 4,
        shadowOpacity: 1,
    },
    metaText: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3.5,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
    },
});
