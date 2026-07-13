import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { Storage, StorageKeys } from '../../lib/storage';
import { fetchApi } from '../../lib/api-client';
import FilmCard from '../../components/catalog/FilmCard';

const { width: SW } = Dimensions.get('window');
const COLS = 3; const GAP = 8;
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
      '¿Seguro que deseas eliminar este título de tu historial?',
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
      <View style={[s.screen, { paddingTop: insets.top + 20 }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={22} color={Colors.white} /></TouchableOpacity>
          <Text style={s.title}>Mi Historial</Text>
        </View>
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Iniciá sesión</Text>
          <Text style={s.emptyText}>Debes estar identificado para ver tu historial de reproducción.</Text>
          <TouchableOpacity style={s.cta} onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={s.ctaText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top + 20 }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={22} color={Colors.white} /></TouchableOpacity>
        <Text style={s.title}>Mi Historial</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
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
            const poster = c?.thumbnails?.find((t: any) => t.type === 'POSTER')?.url;
            return (
              <FilmCard
                id={c?.id}
                title={c?.translations?.[0]?.title}
                posterUrl={poster}
                progress={item.progress}
                duration={item.duration}
                onRemove={() => removeHistory(c?.id || item.id)}
              />
            );
          }}
        />
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Sin actividad aún</Text>
          <Text style={s.emptyText}>Tu historial aparecerá aquí.</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.white },
  cardTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginTop: 6, paddingHorizontal: 2 },
  progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginTop: 16, marginBottom: 4 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  cta: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  ctaText: { fontSize: 14, fontWeight: '900', color: Colors.black, textTransform: 'uppercase' },
});
