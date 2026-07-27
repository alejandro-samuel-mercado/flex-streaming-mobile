import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, User, Lock, ArrowLeft, Zap, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { API_ROUTES } from '../../lib/api-routes';
import { useAuth } from '../../context/AuthContext';
import { scale } from '../../lib/responsive';

export default function LoginScreen() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      router.replace('/(tabs)' as any);
    }
  }, [user]);

  if (user) return null;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { setError('Ingresa tus credenciales del sistema'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(API_ROUTES.AUTH.LOGIN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? 'Error en autenticación cuántica');
      await login(result.data.accessToken, result.data.refreshToken);
      router.replace('/(tabs)' as any);
    } catch (err) { setError(err instanceof Error ? err.message : 'Error de acceso a la red'); }
    setLoading(false);
  };

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#030818', '#130736', '#01040D']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFillObject} />
      
      {/* Irregular diagonal beam in background */}
      <View style={s.bgBeam}>
        <LinearGradient colors={['transparent', 'rgba(0, 212, 255, 0.15)', 'rgba(0, 255, 157, 0.1)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
      </View>

      {!!user && (
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <View style={s.backPod}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View entering={FadeInDown.duration(600)} style={s.cardWrap}>
            {/* Static high-contrast cyber portal box optimized for low-end devices */}
            <View style={s.card}>
              <View style={s.topStrip} />

              <View style={s.logoBadge}>
                <Zap size={18} color="#00FF9D" />
                <Text style={s.logoText}>NUBA </Text>
              </View>

              <Text style={s.heading}>PORTAL DE ACCESO</Text>
             

              {error && (
                <Animated.View entering={FadeIn.duration(300)} style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </Animated.View>
              )}

              <TVInput 
                icon={<User size={20} color="#00D4FF" />}
                placeholder="Usuario" 
                value={username} 
                onChangeText={setUsername} 
                autoCapitalize="none" 
              />

              <TVInput 
               
                icon={<Lock size={20} color="#00FF9D" />}
                placeholder="Contraseña" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPw}
                rightSlot={
                  <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ padding: 4 }}>
                    {showPw ? <EyeOff size={20} color="rgba(255,255,255,0.6)" /> : <Eye size={20} color="rgba(255,255,255,0.6)" />}
                  </TouchableOpacity>
                }
              />

              <TVButton style={s.submitBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#030818" /> : <Text style={s.submitText}>INICIAR SESIÓN</Text>}
              </TVButton>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function TVInput({ icon, rightSlot, onFocus, onBlur, ...props }: any) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef<TextInput>(null);
  return (
    <Pressable 
      onPress={() => inputRef.current?.focus()} 
      style={[s.inputWrap, isFocused && s.inputFocused]}
      accessible={false}
    >
      {icon}
      <TextInput 
        ref={inputRef}
        {...props} 
        style={s.input} 
        placeholderTextColor="rgba(255, 255, 255, 0.45)"
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }} 
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
      />
      {rightSlot}
    </Pressable>
  );
}

function TVButton({ children, onPress, style, disabled }: any) {
  const scaleV = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleV.value }],
  }));
  return (
    <Pressable
      onPressIn={() => { scaleV.value = withSpring(0.97); }}
      onPressOut={() => { scaleV.value = withSpring(1); }}
      onPress={onPress}
      disabled={disabled}
      style={{ width: '100%' }}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#030818' },
  bgBeam: { position: 'absolute', width: 600, height: 250, top: '30%', left: -100, transform: [{ rotate: '-20deg' }] },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 100 },
  backPod: { 
    width: 44, 
    height: 44, 
    borderTopLeftRadius: 18, 
    borderBottomRightRadius: 18, 
    borderTopRightRadius: 6, 
    borderBottomLeftRadius: 6, 
    backgroundColor: '#081026', 
    borderWidth: 1.5, 
    borderColor: '#00D4FF', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#00D4FF',
    shadowRadius: 8,
    shadowOpacity: 0.5,
    elevation: 6,
  },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  cardWrap: { width: '100%' },
  card: { 
    backgroundColor: '#081026', 
    borderTopLeftRadius: 40, 
    borderBottomRightRadius: 40, 
    borderTopRightRadius: 16, 
    borderBottomLeftRadius: 16, 
    borderWidth: 2, 
    borderColor: '#00D4FF', 
    padding: 28, 
    alignItems: 'center',
    shadowColor: '#00D4FF',
    shadowRadius: 20,
    shadowOpacity: 0.5,
    elevation: 10,
    overflow: 'hidden',
  },
  topStrip: { position: 'absolute', top: 0, left: 30, right: 30, height: 4, backgroundColor: '#00FF9D' },
  logoBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0, 255, 157, 0.12)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#00FF9D', marginBottom: 20 },
  logoText: { fontSize: scale(18), fontWeight: '900', color: '#FFFFFF', letterSpacing: 3 },
  heading: { fontSize: scale(22), fontWeight: '900', color: '#FFFFFF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  sub: { fontSize: scale(12), color: 'rgba(255, 255, 255, 0.6)', marginBottom: 28, textAlign: 'center' },
  errorBox: { backgroundColor: 'rgba(255, 51, 102, 0.15)', borderWidth: 1, borderColor: '#FF3366', padding: 12, borderRadius: 12, marginBottom: 20, width: '100%' },
  errorText: { color: '#FF3366', fontSize: scale(12), fontWeight: '800', textAlign: 'center' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#030818', borderWidth: 1.5, borderColor: 'rgba(0, 212, 255, 0.3)', borderTopLeftRadius: 18, borderBottomRightRadius: 18, borderTopRightRadius: 6, borderBottomLeftRadius: 6, paddingHorizontal: 16, height: 56, marginBottom: 16, width: '100%' },
  inputFocused: { borderColor: '#00FF9D', backgroundColor: 'rgba(0, 255, 157, 0.05)', shadowColor: '#00FF9D', shadowRadius: 8, shadowOpacity: 0.5, elevation: 4 },
  input: { flex: 1, color: '#FFFFFF', fontSize: scale(15), fontWeight: '600' },
  submitBtn: { backgroundColor: '#00D4FF', borderTopLeftRadius: 22, borderBottomRightRadius: 22, borderTopRightRadius: 8, borderBottomLeftRadius: 8, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 12, width: '100%', shadowColor: '#00D4FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.8, shadowRadius: 16, elevation: 8 },
  submitText: { fontSize: scale(15), fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 2 },
});
