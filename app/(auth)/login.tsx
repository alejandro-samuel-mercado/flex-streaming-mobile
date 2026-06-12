import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Eye, EyeOff, User, Lock, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { API_ROUTES } from '../../lib/api-routes';
import { useAuth } from '../../context/AuthContext';
import { isTV, scale } from '../../lib/responsive';
import { Pressable } from 'react-native';

const { height: SH } = Dimensions.get('window');

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
    if (!username.trim() || !password.trim()) { setError('Completá todos los campos'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(API_ROUTES.AUTH.LOGIN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? 'Error al iniciar sesión');
      await login(result.data.accessToken, result.data.refreshToken);
      router.replace('/(tabs)' as any);
    } catch (err) { setError(err instanceof Error ? err.message : 'Error inesperado'); }
    setLoading(false);
  };

  return (
    <View style={s.screen}>
      <Image source="https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2670&auto=format&fit=crop" style={StyleSheet.absoluteFillObject} blurRadius={10} />
      <LinearGradient colors={['rgba(3,6,18,0.7)', Colors.bg]} style={StyleSheet.absoluteFillObject} />

      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <BlurView intensity={20} style={s.backBtnBlur}><ArrowLeft size={22} color={Colors.white} /></BlurView>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.center}>
        <Animated.View entering={FadeInDown.duration(600)} style={s.cardWrap}>
          <BlurView intensity={40} style={s.card}>
            <Text style={s.logo}><Text style={{ color: Colors.primary }}>NU</Text>BA</Text>
            <Text style={s.heading}>Bienvenido</Text>
            <Text style={s.sub}>Tu cine privado en cualquier lugar.</Text>

            {error && <Animated.View entering={FadeIn.duration(300)} style={s.errorBox}><Text style={s.errorText}>{error}</Text></Animated.View>}

            <TVInput 
              icon={<User size={20} color={Colors.textMuted} />}
              placeholder="Usuario" 
              value={username} 
              onChangeText={setUsername} 
              autoCapitalize="none" 
            />

            <TVInput 
              icon={<Lock size={20} color={Colors.textMuted} />}
              placeholder="Contraseña" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry={!showPw}
              rightSlot={
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={20} color={Colors.textMuted} /> : <Eye size={20} color={Colors.textMuted} />}
                </TouchableOpacity>
              }
            />

            <TVButton style={s.submitBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.black} /> : <Text style={s.submitText}>Acceder</Text>}
            </TVButton>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

function TVInput({ icon, rightSlot, ...props }: any) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={[s.inputWrap, isFocused && { borderColor: Colors.primary, borderWidth: 2, backgroundColor: 'rgba(0,229,255,0.05)' }]}>
      {icon}
      <TextInput 
        {...props} 
        style={s.input} 
        onFocus={() => setIsFocused(true)} 
        onBlur={() => setIsFocused(false)}
      />
      {rightSlot}
    </View>
  );
}

function TVButton({ children, onPress, style, disabled }: any) {
  const [isFocused, setIsFocused] = useState(false);
  const scaleV = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleV.value }],
    borderWidth: isFocused ? 2 : 0,
    borderColor: isFocused ? Colors.white : 'transparent',
  }));
  return (
    <Pressable
      onFocus={() => { setIsFocused(true); scaleV.value = withSpring(1.05); }}
      onBlur={() => { setIsFocused(false); scaleV.value = withSpring(1); }}
      onPress={onPress}
      disabled={disabled}
      style={{ width: '100%' }}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgDark },
  backBtn: { position: 'absolute', top: 50, left: 16, zIndex: 100 },
  backBtnBlur: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  cardWrap: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  card: { padding: 32, alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: '900', color: Colors.white, textAlign: 'center', letterSpacing: 6, marginBottom: 20 },
  heading: { fontSize: 24, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  sub: { fontSize: 13, color: Colors.textMuted, marginBottom: 32 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderLeftWidth: 4, borderLeftColor: Colors.error, padding: 12, borderRadius: 8, marginBottom: 20, width: '100%' },
  errorText: { color: Colors.errorSoft, fontSize: 12, fontWeight: '700' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 14, width: '100%' },
  input: { flex: 1, color: Colors.white, fontSize: 15, fontWeight: '500' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 12, width: '100%', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  submitText: { fontSize: 15, fontWeight: '900', color: Colors.black, textTransform: 'uppercase', letterSpacing: 2 },
});
