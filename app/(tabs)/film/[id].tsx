import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Play, Plus, ThumbsUp, Star, ArrowLeft, Check, Users, Clock, Globe } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../../lib/api-routes';
import { getContentTypeLabel } from '../../../lib/content-types';
import { fetchApi } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import FilmRow from '../../../components/catalog/FilmRow';

const { width: SW } = Dimensions.get('window');
const SERIES_TYPES = ['SERIES', 'ANIME', 'NOVELA', 'REALITY_SHOW', 'TALK_SHOW', 'VARIETY_SHOW', 'EDUCATIONAL', 'KIDS', 'FAMILY', 'DOCUDRAMA'];

export default function FilmDetailScreen() {
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [content, setContent] = useState<any>(null);
    const [related, setRelated] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const json = await fetchApi<any>(`${API_ROUTES.CONTENT.BASE}/${id}`);
                if (json.success && json.data) setContent(json.data);
                const relJson = await fetchApi<any>(`${API_ROUTES.CONTENT.BASE}/${id}/related`);
                if (relJson.success && relJson.data) setRelated(relJson.data);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        load();
    }, [id]);

    useEffect(() => {
        const checkFavLike = async () => {
            try {
                const [favJson, likeJson] = await Promise.all([
                    fetchApi<any>(`${API_ROUTES.FAVORITES.BASE}/check/${id}`),
                    fetchApi<any>(`${API_ROUTES.LIKES.CHECK(id!)}`),
                ]);
                if (favJson.success) setIsFavorited(favJson.data.isFavorited);
                if (likeJson.success) setIsLiked(likeJson.data.isLiked);
            } catch (e) { }
        };
        if (user) checkFavLike();
    }, [id, user]);

    const toggleFav = async () => {
        if (!user) { router.push('/(auth)/login' as any); return; }
        const oldVal = isFavorited;
        setIsFavorited(!oldVal); // Optimistic update
        try {
            const json = await fetchApi<any>(API_ROUTES.FAVORITES.TOGGLE, { method: 'POST', body: JSON.stringify({ contentId: id }) });
            if (json.success) setIsFavorited(json.data.favorited);
            else setIsFavorited(oldVal); // Rollback if error
        } catch (e) { setIsFavorited(oldVal); }
    };

    const toggleLike = async () => {
        if (!user) { router.push('/(auth)/login' as any); return; }
        const oldVal = isLiked;
        setIsLiked(!oldVal); // Optimistic update
        try {
            const json = await fetchApi<any>(API_ROUTES.LIKES.TOGGLE, { method: 'POST', body: JSON.stringify({ contentId: id }) });
            if (json.success) setIsLiked(json.data.liked);
            else setIsLiked(oldVal); // Rollback if error
        } catch (e) { setIsLiked(oldVal); }
    };

    if (loading) return <View style={s.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    if (!content) return <View style={s.loader}><Text style={{ color: Colors.white }}>No encontrado</Text></View>;

    const tr = content.translations?.[0] || { title: 'Sin título', description: '' };
    const poster = content.thumbnails?.find((t: any) => t.type === 'POSTER')?.url;
    const backdrop = content.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url || poster;
    const isSeries = SERIES_TYPES.includes(content.type);
    const currentSeason = content.seasons?.[selectedSeason];
    const canPlay = (content.status === 'READY' || content.status === 'ACTIVE');

    const bottomPadding = insets.bottom > 0 ? insets.bottom + 90 : 110;

    return (
        <ScrollView style={s.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding }}>
            {/* Cinematic Hero */}
            <View style={s.hero}>
                <Image source={resolveImageUrl(backdrop)} style={s.heroBg} contentFit="cover" blurRadius={10} />
                <LinearGradient colors={['rgba(3,6,18,0.4)', Colors.bg]} style={StyleSheet.absoluteFillObject} />

                <TouchableOpacity style={[s.backBtn, { top: insets.top + 25 }]} onPress={() => router.back()}>
                    <BlurView intensity={30} style={s.backBtnBlur}>
                        <ArrowLeft size={22} color={Colors.white} />
                    </BlurView>
                </TouchableOpacity>

                <Animated.View entering={FadeIn.duration(600)} style={s.heroContent}>
                    <Image source={resolveImageUrl(poster)} style={s.mainPoster} contentFit="cover" transition={400} />
                    <View style={s.heroInfo}>
                        <View style={s.badgeRow}>
                            <View style={s.typeBadge}><Text style={s.typeText}>{getContentTypeLabel(content.type)}</Text></View>
                            {content.isAdult && <View style={s.adultBadge}><Text style={s.adultText}>+18</Text></View>}
                        </View>
                        <Text style={s.heroTitle}>{tr.title}</Text>
                        <View style={s.metaRow}>
                            <Text style={s.metaText}>{content.releaseYear}</Text>
                            <View style={s.dot} />
                            <Text style={s.metaText}>{content.ageRating?.code || 'N/A'}</Text>
                            <View style={s.dot} />
                            <View style={s.ratingWrap}>
                                <Star size={12} fill={Colors.rating} color={Colors.rating} />
                                <Text style={s.ratingVal}>{content.rating}</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Action Row */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={s.actionRow}>
                <TouchableOpacity
                    style={[s.playBtn, !canPlay && s.playBtnDisabled]}
                    disabled={!canPlay}
                    onPress={() => {
                        if (!user) {
                            router.push('/(auth)/login' as any);
                        } else {
                            router.push(`/watch/${id}` as any);
                        }
                    }}
                >
                    <Play size={20} fill={Colors.black} color={Colors.black} />
                    <Text style={s.playBtnText}>{canPlay ? 'Reproducir' : 'Próximamente'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.circleBtn, isFavorited && s.circleBtnActive]} onPress={toggleFav}>
                    {isFavorited ? <Check size={22} color={Colors.primary} /> : <Plus size={22} color={Colors.white} />}
                </TouchableOpacity>
                <TouchableOpacity style={[s.circleBtn, isLiked && s.circleBtnActive]} onPress={toggleLike}>
                    <ThumbsUp size={20} fill={isLiked ? Colors.primary : 'none'} color={isLiked ? Colors.primary : Colors.white} />
                </TouchableOpacity>
            </Animated.View>

            {/* Description */}
            <View style={s.section}>
                <Text style={s.description}>{tr.description}</Text>
            </View>

            {/* Seasons */}
            {isSeries && content.seasons?.length > 0 && (
                <View style={s.section}>
                    <Text style={s.sectionLabel}>Episodios</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.seasonScroll}>
                        {content.seasons.map((se: any, i: number) => (
                            <TouchableOpacity key={se.id} style={[s.seasonTab, i === selectedSeason && s.seasonTabActive]} onPress={() => setSelectedSeason(i)}>
                                <Text style={[s.seasonTabText, i === selectedSeason && s.seasonTabTextActive]}>T{se.number}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {(currentSeason?.episodes || []).map((ep: any) => (
                        <TouchableOpacity
                            key={ep.id}
                            style={s.epCard}
                            onPress={() => {
                                if (!user) {
                                    router.push('/(auth)/login' as any);
                                } else {
                                    router.push(`/watch/${id}?episodeId=${ep.id}` as any);
                                }
                            }}
                        >
                            <View style={s.epNum}><Text style={s.epNumText}>{ep.number}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.epTitle} numberOfLines={1}>{ep.translations?.[0]?.title || `Episodio ${ep.number}`}</Text>
                                {ep.translations?.[0]?.description && <Text style={s.epDesc} numberOfLines={1}>{ep.translations[0].description}</Text>}
                            </View>
                            <Play size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Cast */}
            {(content.actors || []).length > 0 && (
                <View style={s.section}>
                    <Text style={s.sectionLabel}>Reparto</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {content.actors.slice(0, 8).map((a: any, i: number) => (
                            <View key={i} style={s.actorCard}>
                                <Image source={resolveImageUrl(a.actor.photoUrl)} style={s.actorImg} contentFit="cover" />
                                <Text style={s.actorName} numberOfLines={1}>{a.actor.name}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Related */}
            {related.length > 0 && (
                <FilmRow
                    title="Contenido Relacionado"
                    items={related.map(item => ({
                        id: item.id, title: item.translations?.[0]?.title || item.slug,
                        posterUrl: resolveImageUrl(item.thumbnails?.find((t: any) => t.type === 'POSTER')?.url),
                        backdropUrl: resolveImageUrl(item.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url),
                        rating: item.rating, year: item.releaseYear, type: item.type,
                    }))}
                />
            )}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    loader: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
    hero: { height: SW * 0.8, position: 'relative', justifyContent: 'center' },
    heroBg: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
    backBtn: { position: 'absolute', left: 16, zIndex: 100 },
    backBtnBlur: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    heroContent: { flexDirection: 'row', alignItems: 'flex-end', gap: 20, top: 60, paddingHorizontal: 20, paddingBottom: 24 },
    mainPoster: { width: 130, height: 190, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15 },
    heroInfo: { flex: 1 },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    typeBadge: { backgroundColor: Colors.primaryGlow, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)' },
    typeText: { fontSize: 10, fontWeight: '900', color: Colors.primarySoft, textTransform: 'uppercase', letterSpacing: 1.5 },
    adultBadge: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    adultText: { fontSize: 10, fontWeight: '800', color: Colors.errorSoft },
    heroTitle: { fontSize: 28, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', lineHeight: 30, marginBottom: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    metaText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
    ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingVal: { fontSize: 13, fontWeight: '900', color: Colors.rating },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginTop: 10, marginBottom: 24 },
    playBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, height: 56, borderRadius: 16, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
    playBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 },
    playBtnText: { fontSize: 15, fontWeight: '900', color: Colors.black, textTransform: 'uppercase', letterSpacing: 1 },
    circleBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    circleBtnActive: { backgroundColor: 'rgba(0,229,255,0.1)', borderColor: 'rgba(0,229,255,0.3)' },
    section: { paddingHorizontal: 20, marginBottom: 28 },
    description: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },
    sectionLabel: { fontSize: 12, fontWeight: '900', color: Colors.primarySoft, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 },
    seasonScroll: { marginBottom: 16 },
    seasonTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    seasonTabActive: { backgroundColor: 'rgba(0,229,255,0.1)', borderColor: 'rgba(0,229,255,0.3)' },
    seasonTabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
    seasonTabTextActive: { color: Colors.primary },
    epCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
    epNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    epNumText: { fontSize: 14, fontWeight: '900', color: Colors.textMuted },
    epTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
    epDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    actorCard: { alignItems: 'center', marginRight: 16, width: 80 },
    actorImg: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
    actorName: { fontSize: 11, fontWeight: '600', color: Colors.white, textAlign: 'center' },
});
