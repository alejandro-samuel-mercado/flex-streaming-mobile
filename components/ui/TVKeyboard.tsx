import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { scale, isTV } from '../../lib/responsive';

interface TVKeyboardProps {
  onKeyPress: (char: string) => void;
  onAction: (action: 'BACKSPACE' | 'CLEAR' | 'CLOSE' | 'SPACE') => void;
  style?: any;
}

const LAYOUT_LOWERCASE = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '@'],
  ['MAYÚS', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '123#'],
  ['ESPACIO', 'BORRAR', 'LIMPIAR', 'CERRAR']
];

const LAYOUT_UPPERCASE = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '@'],
  ['MINÚS', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '123#'],
  ['ESPACIO', 'BORRAR', 'LIMPIAR', 'CERRAR']
];

const LAYOUT_NUMBERS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
  ['ABC', '.', ',', '?', '!', '\'', '_', '\\', '*', '+'],
  ['ESPACIO', 'BORRAR', 'LIMPIAR', 'CERRAR']
];

function KeyBtn({ label, isSpecial, isPrimary, onPress }: { label: string; isSpecial: boolean; isPrimary: boolean; onPress: () => void }) {
  const [isFocused, setIsFocused] = useState(false);
  const scaleV = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleV.value }],
  }));

  return (
    <Pressable
      focusable={true}
      onFocus={() => { setIsFocused(true); scaleV.value = withTiming(1.1, { duration: 100 }); }}
      onBlur={() => { setIsFocused(false); scaleV.value = withTiming(1, { duration: 100 }); }}
      onPress={onPress}
    >
      <Animated.View style={[
        st.key,
        isSpecial && st.keySpecial,
        isPrimary && st.keyPrimary,
        isFocused && st.keyFocused,
        animStyle,
      ]}>
        <Text style={[st.text, isSpecial && st.textSpecial, isPrimary && st.textPrimary]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function TVKeyboard({ onKeyPress, onAction, style }: TVKeyboardProps) {
  const [mode, setMode] = useState<'LOWER' | 'UPPER' | 'NUMBERS'>('LOWER');

  if (!isTV) return null;

  let currentLayout = LAYOUT_LOWERCASE;
  if (mode === 'UPPER') currentLayout = LAYOUT_UPPERCASE;
  else if (mode === 'NUMBERS') currentLayout = LAYOUT_NUMBERS;

  return (
    <View style={[st.container, style]}>
      {currentLayout.map((row, rIdx) => (
        <View key={`row-${rIdx}`} style={st.row}>
          {row.map((key, cIdx) => {
            const isSpecial = ['MAYÚS', 'MINÚS', '123#', 'ABC', 'ESPACIO', 'BORRAR', 'LIMPIAR', 'CERRAR'].includes(key);
            const isPrimary = key === 'CERRAR';
            return (
              <KeyBtn
                key={`key-${rIdx}-${cIdx}`}
                label={key}
                isSpecial={isSpecial}
                isPrimary={isPrimary}
                onPress={() => {
                  if (key === 'MAYÚS') setMode('UPPER');
                  else if (key === 'MINÚS') setMode('LOWER');
                  else if (key === '123#') setMode('NUMBERS');
                  else if (key === 'ABC') setMode('LOWER');
                  else if (key === 'ESPACIO') onAction('SPACE');
                  else if (key === 'BORRAR') onAction('BACKSPACE');
                  else if (key === 'LIMPIAR') onAction('CLEAR');
                  else if (key === 'CERRAR') onAction('CLOSE');
                  else onKeyPress(key);
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  container: { gap: 6, marginVertical: 8 },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  key: {
    height: 36,
    minWidth: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  keySpecial: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12 },
  keyPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  keyFocused: {
    backgroundColor: 'rgba(0,229,255,0.25)',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  text: { fontSize: 14, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  textSpecial: { fontSize: 11, fontWeight: '900', color: Colors.white },
  textPrimary: { color: Colors.black, fontSize: 11, fontWeight: '900' },
});
