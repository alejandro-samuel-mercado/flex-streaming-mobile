import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, Sparkles, Clock, Heart } from 'lucide-react-native';
import FilmRow from '../../components/catalog/FilmRow';
import Skeleton from '../../components/ui/Skeleton';
import { FuturisticBackground } from '../../components/ui/FuturisticBackground';
import { fetchApi } from '../../lib/api-client';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { scale, UI_SPACING } from '../../lib/responsive';
import { Storage, StorageKeys } from '../../lib/storage';
import { Colors } from '../../theme/colors';

function mapContentToFilm(c: any) {
    if (!c) return null;
    const title = c.translations?.[0]?.title || c.slug || 'Sin título';
    const desc = c.translations?.[0]?.description || '';
    const poster = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);
    const backdrop = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url);
    const genreNames = c.genres?.map((g: any) => g.genre?.name).filter(Boolean) || [];
    const hasVideo = c.status === 'READY' || c.status === 'ACTIVE';
    return {
        id: c.id, title, description: desc,
        posterUrl: poster || backdrop || null, backdropUrl: backdrop || poster || null,
        rating: c.rating, year: c.releaseYear, duration: c.duration,
        type: c.type, genres: genreNames, ageRating: c.ageRating?.code,
        hasVideo,
    };
}

export default function MyNubaScreen() {
    const [history, setHistory] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const bottomPadding = insets.bottom + 90;

    const loadData = useCallback(async () => {
        const token = await Storage.get(StorageKeys.ACCESS_TOKEN);
        if (!token) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const [histRes, favRes] = await Promise.all([
                fetchApi<any>(API_ROUTES.HISTORY.BASE),
                fetchApi<any>(API_ROUTES.FAVORITES.LIST),
            ]);

            if (histRes.success && histRes.data) {
                const list = (histRes.data.data || []).slice(0, 20).map((h: any) => {
                    const f = mapContentToFilm(h.content || h);
                    return f ? { ...f, progress: h.progress, duration: h.duration } : null;
                }).filter(Boolean);
                setHistory(list);
            }

            if (favRes.success && favRes.data) {
                const rawFavs = favRes.data.data || favRes.data.items || favRes.data || [];
                const list = rawFavs.map((fv: any) => mapContentToFilm(fv.content || fv)).filter(Boolean);
                setFavorites(list);
            }
        } catch (e) {
            console.error('My Nuba load error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <FuturisticBackground showOrbs={true} style={s.loader}>
                <View style={{ padding: 20, paddingTop: insets.top + 40, gap: 20 }}>
                    <Skeleton width="60%" height={32} style={{ borderRadius: 12 }} />
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                        <Skeleton width={130} height={190} style={{ borderRadius: 16 }} />
                        <Skeleton width={130} height={190} style={{ borderRadius: 16 }} />
                        <Skeleton width={130} height={190} style={{ borderRadius: 16 }} />
                    </View>
                </View>
            </FuturisticBackground>
        );
    }

    return (
        <FuturisticBackground showOrbs={true}>
            {/* Cyber Header for Mi Nuba */}
            <View style={[s.header, { paddingTop: insets.top + 12 }]}>
                <View style={s.headerLeft}>
                    <View style={s.badge}>
                        <Bookmark size={16} color="#00FF9D" />
                        <Text style={s.headerTitle}>MI <Text style={{ color: '#D946EF' }}>NUBA</Text></Text>
                    </View>
                </View>
                <View style={s.statusPill}>
                    <Sparkles size={12} color="#00FF9D" />
                    <Text style={s.statusText}>ARCHIVO PERSONAL</Text>
                </View>
            </View>

            <ScrollView
                style={s.screen}
                contentContainerStyle={[s.content, { paddingBottom: bottomPadding }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D946EF" colors={['#D946EF', '#00FF9D']} />
                }
            >
                {history.length > 0 ? (
                    <FilmRow title="Continuar viendo" subtitle="Retoma tus reproducciones en pausa" items={history} variant="large" accentColor="#00FF9D" />
                ) : (
                    <View style={s.emptyBox}>
                        <Clock size={28} color="rgba(0, 255, 157, 0.6)" />
                        <Text style={s.emptyTitle}>Sin reproducciones recientes</Text>
                        <Text style={s.emptySub}>El contenido que comiences a ver aparecerá aquí para que continúes cuando desees.</Text>
                    </View>
                )}

                {favorites.length > 0 ? (
                    <FilmRow title="Mi lista" subtitle="Títulos guardados en favoritos" items={favorites} variant="large" accentColor="#D946EF" />
                ) : (
                    <View style={[s.emptyBox, { marginTop: 20 }]}>
                        <Heart size={28} color="rgba(217, 70, 239, 0.6)" />
                        <Text style={s.emptyTitle}>Tu lista está vacía</Text>
                        <Text style={s.emptySub}>Explora nuestro catálogo y presiona el ícono (+) o corazón en tus películas y series favoritas para guardarlas.</Text>
                    </View>
                )}
            </ScrollView>
        </FuturisticBackground>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { paddingBottom: 20 },
    loader: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: 'rgba(5, 2, 20, 0.8)',
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(217, 70, 239, 0.3)',
        zIndex: 10,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: scale(22),
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 255, 157, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 157, 0.4)',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#00FF9D',
        letterSpacing: 1,
    },
    emptyBox: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 24,
        backgroundColor: 'rgba(15, 8, 38, 0.6)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        textAlign: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 12,
        marginBottom: 6,
    },
    emptySub: {
        fontSize: 12.5,
        color: 'rgba(255, 255, 255, 0.65)',
        textAlign: 'center',
        lineHeight: 18,
    },
});
