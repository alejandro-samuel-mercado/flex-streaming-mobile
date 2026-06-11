import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { Storage, StorageKeys } from '../../lib/storage';
import { fetchApi } from '../../lib/api-client';
import HeroBanner from '../../components/catalog/HeroBanner';
import FilmRow from '../../components/catalog/FilmRow';
import FAQSection from '../../components/catalog/FAQSection';
import Skeleton from '../../components/ui/Skeleton';

// Static platform data — same logos as TV version (local PNG assets)
const STATIC_PLATFORMS = [
    { key: 'netflix',     name: 'Netflix',     logoReq: require('../../assets/platforms/netflix.png'),     brandColor: '#E50914' },
    { key: 'disney',      name: 'Disney+',     logoReq: require('../../assets/platforms/disney.png'),      brandColor: '#00D4FF' },
    { key: 'prime',       name: 'Prime Video', logoReq: require('../../assets/platforms/prime.png'),       brandColor: '#00A8E8' },
    { key: 'max',         name: 'Max',         logoReq: require('../../assets/platforms/max.png'),         brandColor: '#6B21A8' },
    { key: 'appletv',     name: 'Apple TV+',   logoReq: require('../../assets/platforms/appletv.png'),     brandColor: '#1C1C1E' },
    { key: 'paramount',   name: 'Paramount+',  logoReq: require('../../assets/platforms/paramount.png'),   brandColor: '#0064FF' },
    { key: 'crunchyroll', name: 'Crunchyroll', logoReq: require('../../assets/platforms/crunchyroll.png'), brandColor: '#F47521' },
    { key: 'hulu',        name: 'Hulu',        logoReq: require('../../assets/platforms/hulu.png'),        brandColor: '#1CE783' },
    { key: 'peacock',     name: 'Peacock',     logoReq: require('../../assets/platforms/peacock.png'),     brandColor: '#000000' },
    { key: 'youtube',     name: 'YouTube',     logoReq: require('../../assets/platforms/youtube.png'),     brandColor: '#FF0000' },
];

interface HomepageData {
    featured: any[];
    trending: any[];
    recent: any[];
    estrenos: any[];
    freeContent: any[];
    platforms: any[];
    genres: any[];
    contentTypes: { type: string; count: number }[];
    plans: any[];
    faq: { question: string; answer: string }[];
    config: Record<string, string>;
}

function mapContentToFilm(c: any) {
    if (!c) return null;
    const title = c.translations?.[0]?.title || c.slug || 'Sin título';
    const desc = c.translations?.[0]?.description || '';
    const poster = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);
    const backdrop = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url);
    const genreNames = c.genres?.map((g: any) => g.genre?.name).filter(Boolean) || [];
    // Content is playable if status is READY or ACTIVE
    const hasVideo = c.status === 'READY' || c.status === 'ACTIVE';
    return {
        id: c.id, title, description: desc,
        posterUrl: poster || backdrop || null, backdropUrl: backdrop || poster || null,
        rating: c.rating, year: c.releaseYear, duration: c.duration,
        type: c.type, genres: genreNames, ageRating: c.ageRating?.code,
        hasVideo,
    };
}

export default function HomeScreen() {
    const [data, setData] = useState<HomepageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [continueWatching, setContinueWatching] = useState<any[]>([]);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    // Bottom padding must clear the tab bar (58px) + safe area
    const bottomPadding = insets.bottom + 80;

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
    const estrenos = (data?.estrenos || []).map(mapContentToFilm).filter((x): x is NonNullable<typeof x> => !!x);
    const platforms = data?.platforms || [];
    const faq = data?.faq || [];

    // Banner: try featured first, fallback to trending
    const bannerSource = featured.length > 0 ? featured : trending;
    const heroSlides = bannerSource.slice(0, 5).map((f: any) => ({
        id: f.id, title: f.title, description: f.description || '',
        backdropUrl: f.backdropUrl || f.posterUrl || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2574',
        rating: f.rating, year: f.year, duration: f.duration, ageRating: f.ageRating, type: f.type, genres: f.genres,
        hasVideo: f.hasVideo,
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
            {/* Hero banner — only if we have slides */}
            {heroSlides.length > 0 && <HeroBanner slides={heroSlides} />}

            {continueWatching.length > 0 && (
                <FilmRow title="Continuar viendo" subtitle="Retoma donde lo dejaste" items={continueWatching} variant="large" accentColor="#FF6B00" />
            )}

            {trending.length > 0 && (
                <FilmRow title="En Tendencia" subtitle="Lo más visto ahora" items={trending} variant="large" accentColor="#FF6B00" />
            )}

            {recent.length > 0 && (
                <FilmRow title="Recién Agregados" subtitle="Nuevas incorporaciones" items={recent} variant="large" accentColor={Colors.primary} />
            )}

            {estrenos.length > 0 && (
                <FilmRow title="Estrenos" subtitle="Lo último en el catálogo" items={estrenos} variant="large" accentColor="#A855F7" />
            )}

            {/* Plataformas */}
            {STATIC_PLATFORMS.length > 0 && (
                <View style={s.platformsSection}>
                    <Text style={s.sectionTitle}>Plataformas</Text>
                    <Text style={s.sectionSub}>Explora por plataforma de streaming</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.platformsList}>
                        {STATIC_PLATFORMS.map((p) => (
                            <TouchableOpacity
                                key={p.key}
                                style={[s.platformCard, { backgroundColor: p.brandColor + '22', borderColor: p.brandColor + '44' }]}
                                onPress={() => router.push(`/explore` as any)}
                                activeOpacity={0.75}
                            >
                                <Image
                                    source={p.logoReq}
                                    style={s.platformLogo}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
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
    platformsSection: { marginBottom: 32 },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.white,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 20,
    },
    sectionSub: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
        marginTop: 4,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    platformsList: {
        paddingHorizontal: 20,
        gap: 12,
    },
    platformCard: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    platformLogo: {
        width: '72%',
        height: '72%',
    },
});
