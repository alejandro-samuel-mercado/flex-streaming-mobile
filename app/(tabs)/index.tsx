import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FAQSection from '../../components/catalog/FAQSection';
import FilmRow from '../../components/catalog/FilmRow';
import HeroBanner from '../../components/catalog/HeroBanner';
import Skeleton from '../../components/ui/Skeleton';
import { FuturisticBackground } from '../../components/ui/FuturisticBackground';
import { fetchApi } from '../../lib/api-client';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { scale, UI_SPACING } from '../../lib/responsive';
import { Storage, StorageKeys } from '../../lib/storage';
import { Colors } from '../../theme/colors';

const STATIC_PLATFORMS = [
    { key: 'netflix',     name: 'Netflix',     logoReq: require('../../assets/platforms/netflix.png'),     brandColor: '#E50914' },
    { key: 'disney',      name: 'Disney+',     logoReq: require('../../assets/platforms/disney.png'),      brandColor: '#00D4FF' },
    { key: 'prime',       name: 'Prime Video', logoReq: require('../../assets/platforms/prime.png'),       brandColor: '#00A8E8' },
    { key: 'max',         name: 'Max',         logoReq: require('../../assets/platforms/max.png'),         brandColor: '#6B21A8' },
    { key: 'appletv',     name: 'Apple TV+',   logoReq: require('../../assets/platforms/appletv.png'),     brandColor: '#1C1C1E' },
    { key: 'paramount',   name: 'Paramount+',  logoReq: require('../../assets/platforms/paramount.png'),   brandColor: '#0064FF' },
    { key: 'crunchyroll', name: 'Crunchyroll', logoReq: require('../../assets/platforms/crunchyroll.png'), brandColor: '#F47521' },
    { key: 'hulu',        name: 'Hulu',        logoReq: require('../../assets/platforms/hulu.png'),        brandColor: '#1CE783' },
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
    const bottomPadding = insets.bottom + 90;

    const loadContinueWatching = useCallback(async () => {
        const token = await Storage.get(StorageKeys.ACCESS_TOKEN);
        if (token) {
            try {
                const json = await fetchApi<any>(API_ROUTES.HISTORY.BASE);
                if (json.success && json.data) {
                    const list = (json.data.data || []).slice(0, 10).map((h: any) => {
                        const f = mapContentToFilm(h.content || h);
                        return f ? { ...f, progress: h.progress, duration: h.duration } : null;
                    }).filter(Boolean);
                    setContinueWatching(list);
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    const loadData = useCallback(async () => {
        try {
            const json = await fetchApi<any>(API_ROUTES.HOMEPAGE.DATA);
            if (json.success && json.data) {
                setData(json.data);
                const urlsToPrefetch: string[] = [];
                (json.data.featured || []).forEach((c: any) => {
                    const poster = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);
                    const backdrop = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url);
                    if (poster) urlsToPrefetch.push(poster);
                    if (backdrop) urlsToPrefetch.push(backdrop);
                });
                (json.data.trending || []).slice(0, 10).forEach((c: any) => {
                    const poster = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);
                    if (poster) urlsToPrefetch.push(poster);
                });
                if (urlsToPrefetch.length > 0) {
                    ExpoImage.prefetch(urlsToPrefetch, 'memory-disk');
                }
            }
        } catch (e) {
            console.error('Homepage fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadContinueWatching();
            if (!data) loadData();
        }, [loadContinueWatching, loadData, data])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
        loadContinueWatching();
    };

    if (loading) {
        return (
            <FuturisticBackground showOrbs={true} style={s.loader}>
                <View style={{ padding: 20, paddingTop: insets.top + 40, gap: 20 }}>
                    <Skeleton width="100%" height={240} style={{ borderRadius: 24 }} />
                    <Skeleton width={180} height={24} style={{ borderRadius: 8, marginTop: 10 }} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Skeleton width={130} height={190} style={{ borderRadius: 16 }} />
                        <Skeleton width={130} height={190} style={{ borderRadius: 16 }} />
                        <Skeleton width={130} height={190} style={{ borderRadius: 16 }} />
                    </View>
                </View>
            </FuturisticBackground>
        );
    }

    const heroSlides = (data?.featured || []).map(mapContentToFilm).filter(Boolean) as any[];
    const trending = (data?.trending || []).map(mapContentToFilm).filter(Boolean) as any[];
    const recent = (data?.recent || []).map(mapContentToFilm).filter(Boolean) as any[];
    const estrenos = (data?.estrenos || []).map(mapContentToFilm).filter(Boolean) as any[];
    const faq = data?.faq || [];

    return (
        <FuturisticBackground showOrbs={true}>
            {/* Transparent Top Nav overlaying Hero (like TV functional version) */}
            <View style={[s.topNav, { paddingTop: insets.top + 10 }]}>
                <View style={s.logoWrap}>
                    <Text style={s.logoTextMain}>NU<Text style={{ color: '#D946EF' }}>BA</Text></Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.navScroll}>
                    <TouchableOpacity style={[s.navTab, s.navTabActive]} onPress={() => {}}>
                        <Text style={[s.navText, s.navTextActive]}>INICIO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.navTab} onPress={() => router.push('/explore?type=SERIES' as any)}>
                        <Text style={s.navText}>SERIES</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.navTab} onPress={() => router.push('/explore?type=MOVIE' as any)}>
                        <Text style={s.navText}>PELÍCULAS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.navTab} onPress={() => router.push('/explore?type=ANIME' as any)}>
                        <Text style={s.navText}>ANIME</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.navTab} onPress={() => router.push('/explore?type=KIDS' as any)}>
                        <Text style={s.navText}>KIDS</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView
                style={s.screen}
                contentContainerStyle={[s.content, { paddingBottom: bottomPadding }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D946EF" colors={['#D946EF', '#00FF9D']} />
                }
            >
                {heroSlides.length > 0 && <HeroBanner slides={heroSlides} />}

                {continueWatching.length > 0 && (
                    <View style={{ marginTop: scale(10) }}>
                        <FilmRow title="Continuar viendo" subtitle="Retoma tu sesión cuántica" items={continueWatching} variant="large" accentColor="#00FF9D" />
                    </View>
                )}

                {trending.length > 0 && (
                    <FilmRow title="En Tendencia" subtitle="Lo más visto en la red" items={trending} variant="large" accentColor="#D946EF" />
                )}

                {recent.length > 0 && (
                    <FilmRow title="Recién Agregados" subtitle="Nuevas transmisiones" items={recent} variant="large" accentColor="#00FF9D" />
                )}

                {estrenos.length > 0 && (
                    <FilmRow title="Estrenos" subtitle="Lo último en el hiperespacio" items={estrenos} variant="large" accentColor="#8B5CF6" />
                )}

                {STATIC_PLATFORMS.length > 0 && (
                    <View style={s.platformsSection}>
                        <View style={s.sectionHeaderRow}>
                            <View style={s.sectionAccentBar} />
                            <View>
                                <Text style={s.sectionTitle}>NEXOS POR PLATAFORMA</Text>
                                <Text style={s.sectionSub}>Frecuencias de streaming integradas</Text>
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.platformsList}>
                            {STATIC_PLATFORMS.map((p) => (
                                <TouchableOpacity
                                    key={p.key}
                                    style={s.platformPod}
                                    onPress={() => router.push(`/explore` as any)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[s.platformInner, { borderColor: p.brandColor + 'AA', backgroundColor: p.brandColor + '18' }]}>
                                        <Image source={p.logoReq} style={s.platformLogo} resizeMode="contain" />
                                        <View style={[s.platformGlow, { backgroundColor: p.brandColor }]} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {faq.length > 0 && <FAQSection items={faq} />}
            </ScrollView>
        </FuturisticBackground>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { paddingBottom: 20 },
    loader: { flex: 1 },
    
    topNav: {
        position: 'absolute',
        top: 7,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: 'transparent',
    },
    logoWrap: {
        marginRight: 16,
    },
    logoTextMain: {
        fontSize: scale(24),
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 3,
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    navScroll: {
        alignItems: 'center',
        gap: 8,
        paddingRight: 20,
    },
    navTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: 'rgba(5, 2, 20, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    navTabActive: {
        backgroundColor: '#D946EF',
        borderColor: '#D946EF',
        shadowColor: '#D946EF',
        shadowRadius: 8,
        shadowOpacity: 0.8,
        elevation: 4,
    },
    navText: {
        fontSize: scale(12),
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.8)',
        letterSpacing: 0.5,
    },
    navTextActive: {
        color: '#FFFFFF',
        fontWeight: '900',
    },
    
    platformsSection: { marginBottom: scale(32), marginTop: scale(16) },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: UI_SPACING.horizontal,
        marginBottom: scale(14),
    },
    sectionAccentBar: {
        width: 4,
        height: 26,
        backgroundColor: '#00FF9D',
        borderRadius: 2,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: scale(16, 1.8),
        fontWeight: '900',
        color: Colors.white,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionSub: {
        fontSize: scale(11, 1.5),
        color: Colors.textMuted,
        fontWeight: '600',
        marginTop: 2,
    },
    platformsList: {
        paddingHorizontal: UI_SPACING.horizontal,
        gap: scale(12),
    },
    platformPod: {
        width: scale(60),
        height: scale(60),
    },
    platformInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderWidth: 1.2,
        overflow: 'hidden',
    },
    platformLogo: {
        width: '68%',
        height: '68%',
        zIndex: 2,
    },
    platformGlow: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        opacity: 0.3,
    },
});
