import React from 'react';
import { StyleSheet, View, ViewStyle, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    intensity?: number;
    tint?: 'dark' | 'light' | 'default';
    borderColor?: string;
    borderWidth?: number;
    onPress?: () => void;
    glow?: boolean;
    borderRadius?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    intensity = 55,
    tint = 'dark',
    borderColor = 'rgba(0, 229, 255, 0.22)',
    borderWidth = 1,
    onPress,
    glow = false,
    borderRadius = 20,
}) => {
    const content = (
        <View style={[styles.container, { borderRadius }, style]}>
            {/* Background Blur */}
            <BlurView
                intensity={intensity}
                tint={tint}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Subtle Gradient Overlay for glass reflection */}
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Border Outline */}
            <View
                style={[
                    StyleSheet.absoluteFillObject,
                    styles.borderOutline,
                    {
                        borderRadius,
                        borderColor,
                        borderWidth,
                    },
                    glow && styles.glowEffect,
                ]}
                pointerEvents="none"
            />

            {/* Inner Content */}
            <View style={styles.content}>{children}</View>
        </View>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
                ]}
            >
                {content}
            </Pressable>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: 'rgba(10, 15, 36, 0.65)',
    },
    borderOutline: {
        backgroundColor: 'transparent',
    },
    glowEffect: {
        shadowColor: '#00E5FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
    },
    content: {
        position: 'relative',
        zIndex: 1,
    },
});
