import React, { useState } from 'react';
import { Pressable, StyleSheet, ViewStyle, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';

interface TVFocusableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  activeScale?: number;
  glowColor?: string;
}

export default function TVFocusable({ 
  children, 
  onPress, 
  style, 
  activeScale = 1.08,
  glowColor = Colors.primary 
}: TVFocusableProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: isFocused ? glowColor : 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    shadowOpacity: glowOpacity.value,
    shadowColor: glowColor,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: isFocused ? 10 : 0,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    scale.value = withSpring(activeScale);
    glowOpacity.value = withSpring(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    scale.value = withSpring(1);
    glowOpacity.value = withSpring(0);
  };

  return (
    <Pressable
      onPress={onPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={({ pressed }) => [
        style,
        { opacity: pressed ? 0.8 : 1 }
      ]}
    >
      <Animated.View style={[s.inner, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  inner: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
