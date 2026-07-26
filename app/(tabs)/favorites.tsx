import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { Storage, StorageKeys } from '../../lib/storage';
import { fetchApi } from '../../lib/api-client';
import { Heart, Sparkles } from 'lucide-react-native';
import FilmCard from '../../components/catalog/FilmCard';
import { FuturisticBackground } from '../../components/ui/FuturisticBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { scale } from '../../lib/responsive';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 12;
const CW = (SW - 32 - GAP * (COLS - 1)) / COLS;

export default function FavoritesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bottomPadding = insets.bottom > 0 ? insets.bottom + 90 : 100;
    const [favs, setFavs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            const load = async () => {
                const token = await Storage.get(StorageKeys.ACCESS_TOKEN);
                setHasToken(!!token);
                if (!token) { setLoading(false); return; }

                try {
                    const json = await fetchApi<any>(API_ROUTES.FAVORITES.BASE);
                    if (json.success && json.data) {
                        const items = Array.isArray(json.data) ? json.data : (json.data.data || []);
                        setFavs(items);
                    }
                } catch (e) {
                    console.error(e);
                    setFavs([]);
                }
                setLoading(false);
            };
            load();
        }, [])
    );

    const removeFavorite = async (id: string) => {
        Alert.alert(
            'Eliminar de favoritos',
            '¿Seguro que deseas eliminar este título de tu lista?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: async () => {
                    try {
                        const res = await fetchApi<any>(API_ROUTES.FAVORITES.TOGGLE, {
                            method: 'POST',
                            body: JSON.stringify({ contentId: id })
                        });
                        if (res.success) {
                            setFavs(prev => prev.filter(f => f.id !== id));
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }}
            ]
        );
    };

    if (hasToken === false && !loading) {
        return (
            <FuturisticBackground showOrbs={true}>
                <View style={[s.screen, { paddingTop: insets.top + 20 }]}>
                    <Text style={s.title}>Mis Favoritos</Text>
                    <View style={s.emptyWrap}>
                        <GlassCard intensity={65} borderRadius={24} borderColor="rgba(255, 0, 85, 0.4)" glow={true} style={s.emptyCard}>
                            <View style={s.emptyInner}>
                                <Heart size={56} color="#FF0055" />
                                <Text style={s.emptyTitle}>Sesión Requerida</Text>
                                <Text style={s.emptyText}>Debes estar identificado en el sistema para acceder a tus favoritos guardados en el hiperespacio.</Text>
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
                    <View>
                        <Text style={s.title}>Mis Favoritos</Text>
                        <Text style={s.sub}>Tus títulos guardados para el futuro</Text>
                    </View>
                    <View style={s.badge}>
                        <Sparkles size={14} color={Colors.primary} />
                        <Text style={s.badgeText}>{favs.length}</Text>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
                ) : favs.length > 0 ? (
                    <FlatList
                        data={favs}
                        numColumns={COLS}
                        columnWrapperStyle={{ gap: GAP }}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: GAP, paddingBottom: bottomPadding }}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => {
                            const poster = resolveImageUrl(item.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);
                            const backdrop = resolveImageUrl(item.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url);
                            return (
                                <FilmCard
                                    id={item.id}
                                    title={item.translations?.[0]?.title || item.slug}
                                    posterUrl={poster || backdrop}
                                    rating={item.rating}
                                    year={item.releaseYear}
                                    type={item.type}
                                    onRemove={() => removeFavorite(item.id)}
                                />
                            );
                        }}
                    />
                ) : (
                    <View style={s.emptyWrap}>
                        <GlassCard intensity={60} borderRadius={24} borderColor="rgba(0, 229, 255, 0.3)" style={s.emptyCard}>
                            <View style={s.emptyInner}>
                                <Heart size={56} color={Colors.primary} />
                                <Text style={s.emptyTitle}>Lista Vacía</Text>
                                <Text style={s.emptyText}>Aún no has agregado ninguna película o serie a tus favoritos cuánticos.</Text>
                                <TouchableOpacity style={s.cta} onPress={() => router.push('/(tabs)/explore' as any)}>
                                    <Text style={s.ctaText}>Explorar Catálogo</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, marginBottom: 20 },
    title: { fontSize: scale(26), fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1.5 },
    sub: { fontSize: scale(12), color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0, 229, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)' },
    badgeText: { color: Colors.primary, fontWeight: '900', fontSize: scale(14) },
    emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 60 },
    emptyCard: { width: '100%' },
    emptyInner: { padding: 32, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: scale(20), fontWeight: '900', color: Colors.white, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    emptyText: { fontSize: scale(14), color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    cta: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, shadowColor: Colors.primary, shadowRadius: 10, shadowOpacity: 0.8, elevation: 6 },
    ctaText: { fontSize: scale(13), fontWeight: '900', color: Colors.black, textTransform: 'uppercase', letterSpacing: 1 },
});
