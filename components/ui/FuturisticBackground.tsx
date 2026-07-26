import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

interface FuturisticBackgroundProps {
    children?: React.ReactNode;
    style?: any;
    showOrbs?: boolean;
}

export const FuturisticBackground: React.FC<FuturisticBackgroundProps> = ({
    children,
    style,
    showOrbs = true,
}) => {
    // Shared values for high performance UI-thread animations (zero JS bridge overhead)
    const orb1TranslateY = useSharedValue(0);
    const orb1Scale = useSharedValue(1);
    const orb2TranslateX = useSharedValue(0);
    const orb2Scale = useSharedValue(1);
    const waveRotate = useSharedValue(0);

    useEffect(() => {
        if (!showOrbs) return;

        // Orb 1: Neon Magenta Top-Right breathing & floating
        orb1TranslateY.value = withRepeat(
            withSequence(
                withTiming(35, { duration: 6000, easing: Easing.inOut(Easing.quad) }),
                withTiming(-25, { duration: 7000, easing: Easing.inOut(Easing.quad) }),
                withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );
        orb1Scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.85, { duration: 8000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );

        // Orb 2: Electric Mint Bottom-Left drifting
        orb2TranslateX.value = withRepeat(
            withSequence(
                withTiming(45, { duration: 9000, easing: Easing.inOut(Easing.quad) }),
                withTiming(-35, { duration: 8000, easing: Easing.inOut(Easing.quad) }),
                withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );
        orb2Scale.value = withRepeat(
            withSequence(
                withTiming(1.25, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.8, { duration: 9000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );

        // Irregular Diagonal Cyber Wave rotation
        waveRotate.value = withRepeat(
            withSequence(
                withTiming(8, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
                withTiming(-8, { duration: 11000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, [showOrbs]);

    const orb1Style = useAnimatedStyle(() => ({
        transform: [
            { translateY: orb1TranslateY.value },
            { scale: orb1Scale.value },
        ],
    }));

    const orb2Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: orb2TranslateX.value },
            { scale: orb2Scale.value },
        ],
    }));

    const waveStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${waveRotate.value}deg` }],
    }));

    return (
        <View style={[styles.container, style]}>
            {/* Base Deep Violet Cyber Space */}
            <LinearGradient
                colors={['#050214', '#0D0528', '#03010A']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Irregular Curved Diagonal Cyber Wave / Light Beam */}
            {showOrbs && (
                <Animated.View style={[styles.waveBeam, waveStyle]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(217, 70, 239, 0.12)', 'rgba(0, 255, 157, 0.08)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                </Animated.View>
            )}

            {/* Animated Glow Orbs (Native UI Thread Worklets) */}
            {showOrbs && (
                <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                    {/* Top Right Neon Magenta Glow */}
                    <Animated.View style={[styles.orb, styles.orbTopRight, orb1Style]}>
                        <LinearGradient
                            colors={['rgba(217, 70, 239, 0.35)', 'rgba(217, 70, 239, 0.06)', 'transparent']}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </Animated.View>

                    {/* Bottom Left Electric Mint Glow */}
                    <Animated.View style={[styles.orb, styles.orbBottomLeft, orb2Style]}>
                        <LinearGradient
                            colors={['rgba(0, 255, 157, 0.28)', 'rgba(0, 255, 157, 0.05)', 'transparent']}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </Animated.View>
                </View>
            )}

            {/* Futuristic Star / Cyber Particle Specks */}
            <View style={styles.particlesContainer} pointerEvents="none">
                <View style={[styles.particle, { top: '12%', left: '18%', width: 4, height: 4, backgroundColor: '#D946EF', shadowColor: '#D946EF' }]} />
                <View style={[styles.particle, { top: '22%', right: '12%', width: 3, height: 3, backgroundColor: '#00FF9D', shadowColor: '#00FF9D', opacity: 0.8 }]} />
                <View style={[styles.particle, { top: '38%', left: '8%', width: 2.5, height: 2.5, backgroundColor: '#F0ABFC', opacity: 0.6 }]} />
                <View style={[styles.particle, { top: '55%', right: '22%', width: 3.5, height: 3.5, backgroundColor: '#D946EF', shadowColor: '#D946EF', opacity: 0.75 }]} />
                <View style={[styles.particle, { top: '75%', left: '25%', width: 3, height: 3, backgroundColor: '#00FF9D', shadowColor: '#00FF9D', opacity: 0.7 }]} />
                <View style={[styles.particle, { top: '88%', right: '18%', width: 2, height: 2, backgroundColor: '#FFFFFF', opacity: 0.5 }]} />
            </View>

            {/* Main Content */}
            <View style={styles.content}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
        overflow: 'hidden',
    },
    waveBeam: {
        position: 'absolute',
        width: width * 2,
        height: height * 0.4,
        top: height * 0.25,
        left: -width * 0.5,
        borderRadius: width,
        transform: [{ rotate: '-15deg' }],
    },
    orb: {
        position: 'absolute',
        width: width * 1.25,
        height: width * 1.25,
        borderRadius: (width * 1.25) / 2,
    },
    orbTopRight: {
        top: -width * 0.45,
        right: -width * 0.45,
    },
    orbBottomLeft: {
        bottom: -width * 0.35,
        left: -width * 0.45,
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    particle: {
        position: 'absolute',
        borderRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 3,
    },
    content: {
        flex: 1,
    },
});
