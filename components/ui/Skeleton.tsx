import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, withSequence } from 'react-native-reanimated';

const { width: SW } = Dimensions.get('window');

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: any;
}

export default function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
    const opacity = useSharedValue(0.3);

    React.useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                s.skeleton,
                { width: width as any, height: height as any, borderRadius },
                animatedStyle,
                style
            ]}
        />
    );
}

const s = StyleSheet.create({
    skeleton: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
});
