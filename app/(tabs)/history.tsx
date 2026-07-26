import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { Storage, StorageKeys } from '../../lib/storage';
import { fetchApi } from '../../lib/api-client';
import FilmCard from '../../components/catalog/FilmCard';
import { FuturisticBackground } from '../../components/ui/FuturisticBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { scale } from '../../lib/responsive';

const { width: SW } = Dimensions.get('window');
const COLS = 3; const GAP = 12;
const CW = (SW - 32 - GAP * (COLS - 1)) / COLS;

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = await Storage.get(StorageKeys.ACCESS_TOKEN);
      setHasToken(!!token);
      if (!token) { setLoading(false); return; }
      
      try {
        const json = await fetchApi<any>(API_ROUTES.HISTORY.BASE);
        if (json.success && json.data) setHistory(json.data.data || []);
      } catch (e) { 
        console.error(e); 
        setHistory([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const removeHistory = async (id: string) => {
    Alert.alert(
      'Eliminar del historial',
      '¿Seguro que deseas eliminar este título de tu historial cuántico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            const res = await fetchApi<any>(`${API_ROUTES.HISTORY.BASE}/${id}`, {
              method: 'DELETE'
            });
            if (res.success) {
              setHistory(prev => prev.filter(f => (f.content?.id || f.id) !== id));
            }
          } catch (e) {
            console.error(e);
          }
        }}
      ]
    );
  };

  const bottomPadding = insets.bottom > 0 ? insets.bottom + 90 : 110;

  if (hasToken === false && !loading) {
    return (
      <FuturisticBackground showOrbs={true}>
        <View style={[s.screen, { paddingTop: insets.top + 20 }]}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <ArrowLeft size={22} color={Colors.white} />
            </TouchableOpacity>
            <Text style={s.title}>Historial temporal</Text>
          </View>
          <View style={s.emptyWrap}>
            <GlassCard intensity={65} borderRadius={24} borderColor="rgba(0, 229, 255, 0.4)" glow={true} style={s.emptyCard}>
              <View style={s.emptyInner}>
                <Clock size={56} color={Colors.primary} />
                <Text style={s.emptyTitle}>Sesión Requerida</Text>
                <Text style={s.emptyText}>Debes estar identificado en el hiperespacio para consultar tu registro de reproducciones.</Text>
                <TouchableOpacity style={s.cta} onPress={() => router.push('/(auth)/login' as any)}>
                  <Text style={s.ctaText}>Iniciar Sesión</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </View>
      </FuturisticBackground>
    );
  }

  return (
    <FuturisticBackground showOrbs={true}>
      <View style={[s.screen, { paddingTop: insets.top + 10 }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={s.title}>BITÁCORA DE REPRODUCCIÓN</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
        ) : history.length > 0 ? (
          <FlatList
            data={history}
            numColumns={COLS}
            columnWrapperStyle={{ gap: GAP }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: GAP, paddingBottom: bottomPadding }}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.content?.id || item.id}
            renderItem={({ item }) => {
              const c = item.content;
              const poster = resolveImageUrl(c?.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);
              const backdrop = resolveImageUrl(c?.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url);
              return (
                <FilmCard
                  id={c?.id}
                  title={c?.translations?.[0]?.title || c?.slug}
                  posterUrl={poster || backdrop}
                  progress={item.progress}
                  duration={item.duration}
                  onRemove={() => removeHistory(c?.id || item.id)}
                />
              );
            }}
          />
        ) : (
          <View style={s.emptyWrap}>
            <GlassCard intensity={60} borderRadius={24} borderColor="rgba(0, 229, 255, 0.3)" style={s.emptyCard}>
              <View style={s.emptyInner}>
                <Clock size={56} color={Colors.primary} />
                <Text style={s.emptyTitle}>Bitácora Vacía</Text>
                <Text style={s.emptyText}>No has reproducido ningún título en el sistema. Tu actividad cuántica aparecerá aquí.</Text>
                <TouchableOpacity style={s.cta} onPress={() => router.push('/(tabs)/explore' as any)}>
                  <Text style={s.ctaText}>Explorar Contenido</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        )}
      </View>
    </FuturisticBackground>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 229, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: scale(22), fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1.5 },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 60 },
  emptyCard: { width: '100%' },
  emptyInner: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: scale(20), fontWeight: '900', color: Colors.white, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  emptyText: { fontSize: scale(14), color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  cta: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, shadowColor: Colors.primary, shadowRadius: 10, shadowOpacity: 0.8, elevation: 6 },
  ctaText: { fontSize: scale(13), fontWeight: '900', color: Colors.black, textTransform: 'uppercase', letterSpacing: 1 },
});
