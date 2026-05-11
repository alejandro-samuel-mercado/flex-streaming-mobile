import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { Storage, StorageKeys } from '../../lib/storage';
import { fetchApi } from '../../lib/api-client';
import HeroBanner from '../../components/catalog/HeroBanner';
import FilmRow from '../../components/catalog/FilmRow';
import PlanCards from '../../components/catalog/PlanCards';
import FAQSection from '../../components/catalog/FAQSection';
import Skeleton from '../../components/ui/Skeleton';

interface HomepageData {
    featured: any[]; trending: any[]; recent: any[]; freeContent: any[];
    platforms: any[]; genres: any[]; contentTypes: { type: string; count: number }[];
    plans: any[]; faq: { question: string; answer: string }[];
    config: Record<string, string>;
}

function mapContentToFilm(c: any) {
    if (!c) return null;
    const title = c.translations?.[0]?.title || c.slug || 'Sin título';
    const desc = c.translations?.[0]?.description || '';
    const poster = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);
    const backdrop = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url);
    const genreNames = c.genres?.map((g: any) => g.genre?.name).filter(Boolean) || [];
    return {
        id: c.id, title, description: desc,
        posterUrl: poster || backdrop || null, backdropUrl: backdrop || poster || null,
        rating: c.rating, year: c.releaseYear, duration: c.duration,
        type: c.type, genres: genreNames, ageRating: c.ageRating?.code,
    };
}

export default function HomeScreen() {
    const [data, setData] = useState<HomepageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [continueWatching, setContinueWatching] = useState<any[]>([]);
    const insets = useSafeAreaInsets();
    const bottomPadding = insets.bottom > 0 ? insets.bottom + 80 : 100;

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const token = await Storage.get(StorageKeys.ACCESS_TOKEN);

        // Fetch continue watching ONLY if logged in
        if (token) {
            try {
                const cwJson = await fetchApi<any>(`${API_ROUTES.HISTORY.BASE}/continue`);
                if (cwJson.success && cwJson.data) {
                    setContinueWatching(cwJson.data.map((h: any) => {
                        const film = mapContentToFilm(h.content);
                        if (!film) return null;
                        return { ...film, episodeId: h.episodeId, progress: h.progress, duration: h.duration, customLink: `/watch/${film.id}${h.episodeId ? `?episodeId=${h.episodeId}` : ''}` };
                    }).filter((x: any): x is NonNullable<typeof x> => !!x));
                }
            } catch (e) {
                setContinueWatching([]);
            }
        } else {
            setContinueWatching([]);
        }

        // Fetch homepage data
        try {
            const resJson = await fetchApi<any>(API_ROUTES.HOMEPAGE.DATA);
            if (resJson.success && resJson.data) {
                setData(resJson.data);
            }
        } catch (e) { console.error('Homepage fetch error:', e); }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = useCallback(() => {
        load(true);
    }, [load]);

    if (loading) {
        return (
            <View style={s.loader}>
                <Skeleton height={SCREEN_HEIGHT * 0.6} borderRadius={0} />
                <View style={{ padding: 20 }}>
                    <Skeleton width={150} height={24} style={{ marginBottom: 20 }} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Skeleton width={140} height={200} borderRadius={14} />
                        <Skeleton width={140} height={200} borderRadius={14} />
                        <Skeleton width={140} height={200} borderRadius={14} />
                    </View>
                    <Skeleton width={180} height={24} style={{ marginTop: 40, marginBottom: 20 }} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Skeleton width={140} height={200} borderRadius={14} />
                        <Skeleton width={140} height={200} borderRadius={14} />
                        <Skeleton width={140} height={200} borderRadius={14} />
                    </View>
                </View>
            </View>
        );
    }

    const featured = (data?.featured || []).map(mapContentToFilm).filter((x): x is NonNullable<typeof x> => !!x);
    const trending = (data?.trending || []).map(mapContentToFilm).filter((x): x is NonNullable<typeof x> => !!x);
    const recent = (data?.recent || []).map(mapContentToFilm).filter((x): x is NonNullable<typeof x> => !!x);
    const plans = data?.plans || [];
    const faq = data?.faq || [];
    const config = data?.config || {};
    const whatsappNumber = config['whatsapp_number'] || '';

    const heroSlides = (featured.length > 0 ? featured : trending).slice(0, 5).map((f: any) => ({
        id: f.id, title: f.title, description: f.description || '',
        backdropUrl: f.backdropUrl || f.posterUrl || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2574',
        rating: f.rating, year: f.year, duration: f.duration, ageRating: f.ageRating, type: f.type, genres: f.genres,
    }));


    return (
        <ScrollView
            style={s.screen}
            contentContainerStyle={[s.content, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
            }
        >
            <HeroBanner slides={heroSlides} />

            {continueWatching.length > 0 && (
                <FilmRow title="Continuar viendo" subtitle="Retoma donde lo dejaste" items={continueWatching} variant="large" accentColor="#FF6B00" />
            )}

            {trending.length > 0 && (
                <FilmRow title="En Tendencia" subtitle="Lo más visto en este momento" items={trending} variant="large" accentColor="#FF6B00" />
            )}

            {recent.length > 0 && (
                <FilmRow title="Estrenos" subtitle="Recién llegados al catálogo" items={recent} variant="large" accentColor="#00D4FF" />
            )}


            {faq.length > 0 && <FAQSection items={faq} />}
        </ScrollView>
    );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { paddingBottom: 20 },
    loader: { flex: 1, backgroundColor: Colors.bg },
    logoText: { fontSize: 40, fontWeight: '900', color: Colors.white, letterSpacing: 4 },
    loaderText: { color: Colors.textMuted, marginTop: 12, fontSize: 14, fontWeight: '500' },
});
