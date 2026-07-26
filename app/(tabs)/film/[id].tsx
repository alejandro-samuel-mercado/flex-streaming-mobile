import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Play, Plus, ThumbsUp, Star, ArrowLeft, Check, Sparkles, Zap } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../../lib/api-routes';
import { getContentTypeLabel } from '../../../lib/content-types';
import { fetchApi } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import FilmRow from '../../../components/catalog/FilmRow';
import { FuturisticBackground } from '../../../components/ui/FuturisticBackground';
import { scale } from '../../../lib/responsive';

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
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            setContent(null);
            setRelated([]);
            setSelectedSeason(0);
            try {
                const json = await fetchApi<any>(`${API_ROUTES.CONTENT.BASE}/${id}`);
                if (!isMounted) return;
                if (json.success && json.data) setContent(json.data);
                const relJson = await fetchApi<any>(`${API_ROUTES.CONTENT.BASE}/${id}/related`);
                if (!isMounted) return;
                if (relJson.success && relJson.data) setRelated(relJson.data);
            } catch (e) { console.error(e); }
            if (isMounted) setLoading(false);
        };
        load();
        return () => { isMounted = false; };
    }, [id]);

    useEffect(() => {
        let isMounted = true;
        setIsFavorited(false);
        setIsLiked(false);
        const checkFavLike = async () => {
            try {
                const [favJson, likeJson] = await Promise.all([
                    fetchApi<any>(`${API_ROUTES.FAVORITES.BASE}/check/${id}`),
                    fetchApi<any>(`${API_ROUTES.LIKES.CHECK(id!)}`),
                ]);
                if (!isMounted) return;
                if (favJson.success) setIsFavorited(favJson.data.isFavorited);
                if (likeJson.success) setIsLiked(likeJson.data.isLiked);
            } catch (e) { }
        };
        if (user) checkFavLike();
        return () => { isMounted = false; };
    }, [id, user]);

    const toggleFav = async () => {
        if (!user) { router.push('/(auth)/login' as any); return; }
        const oldVal = isFavorited;
        setIsFavorited(!oldVal);
        try {
            const json = await fetchApi<any>(API_ROUTES.FAVORITES.TOGGLE, { method: 'POST', body: JSON.stringify({ contentId: id }) });
            if (json.success) setIsFavorited(json.data.favorited);
            else setIsFavorited(oldVal);
        } catch (e) { setIsFavorited(oldVal); }
    };

    const toggleLike = async () => {
        if (!user) { router.push('/(auth)/login' as any); return; }
        const oldVal = isLiked;
        setIsLiked(!oldVal);
        try {
            const json = await fetchApi<any>(API_ROUTES.LIKES.TOGGLE, { method: 'POST', body: JSON.stringify({ contentId: id }) });
            if (json.success) setIsLiked(json.data.liked);
            else setIsLiked(oldVal);
        } catch (e) { setIsLiked(oldVal); }
    };

    if (loading) {
        return (
            <FuturisticBackground style={s.loader}>
                <ActivityIndicator size="large" color="#D946EF" />
            </FuturisticBackground>
        );
    }
    
    if (!content) {
        return (
            <FuturisticBackground style={s.loader}>
                <Text style={{ color: Colors.white, fontSize: scale(16), fontWeight: '700' }}>No encontrado en la matriz</Text>
            </FuturisticBackground>
        );
    }

    const tr = content.translations?.[0] || { title: 'Sin título', description: '' };
    const poster = content.thumbnails?.find((t: any) => t.type === 'POSTER')?.url;
    const backdrop = content.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url || poster;
    const isSeries = SERIES_TYPES.includes(content.type);
    const currentSeason = content.seasons?.[selectedSeason];
    const canPlay = (content.status === 'READY' || content.status === 'ACTIVE');
    const bottomPadding = insets.bottom > 0 ? insets.bottom + 90 : 110;

    return (
        <FuturisticBackground showOrbs={true}>
            <ScrollView style={s.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding }}>
                {/* Cinematic Hero with straight dissolving bottom gradient */}
                <View style={s.hero}>
                    <View style={s.heroBgCurveWrap}>
                        <Image source={resolveImageUrl(backdrop)} style={s.heroBg} contentFit="cover" />
                        <LinearGradient colors={['transparent', 'rgba(5, 2, 20, 0.4)', 'rgba(5, 2, 20, 0.85)', '#050214']} locations={[0, 0.5, 0.8, 1]} style={StyleSheet.absoluteFillObject} />
                    </View>

                    <TouchableOpacity style={[s.backBtn, { top: insets.top + 15 }]} onPress={() => router.back()}>
                        <View style={s.backPod}>
                            <ArrowLeft size={20} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    <Animated.View entering={FadeIn.duration(600)} style={s.heroContentWrap}>
                        <View style={s.heroTopRow}>
                            <View style={s.mainPosterWrap}>
                                <Image source={resolveImageUrl(poster)} style={s.mainPoster} contentFit="cover" transition={400} />
                                <View style={s.posterGlow} />
                            </View>
                            
                            <View style={s.heroInfo}>
                                <View style={s.badgeRow}>
                                    <View style={s.typeBadge}>
                                        <Zap size={11} color="#00FF9D" />
                                        <Text style={s.typeText}>{getContentTypeLabel(content.type)}</Text>
                                    </View>
                                    {content.isAdult && <View style={s.adultBadge}><Text style={s.adultText}>+18</Text></View>}
                                </View>
                                <Text style={s.heroTitle}>{tr.title}</Text>
                                <View style={s.metaRow}>
                                    {!!content.releaseYear && <Text style={s.metaText}>{content.releaseYear}</Text>}
                                    {!!content.releaseYear && !!content.ageRating?.code && <View style={s.dot} />}
                                    {!!content.ageRating?.code && <Text style={s.metaText}>{content.ageRating.code}</Text>}
                                    {!!content.rating && (
                                        <>
                                            <View style={s.dot} />
                                            <View style={s.ratingWrap}>
                                                <Star size={11} fill="#FACC15" color="#FACC15" />
                                                <Text style={s.ratingVal}>{content.rating}</Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                                
                                {/* Categories / Genres without N/A */}
                                {content.genres?.length > 0 && (
                                    <View style={s.genreRow}>
                                        {content.genres.map((g: any, i: number) => {
                                            const label = typeof g === 'string' ? g : (g?.name || g?.genre?.name || g?.genre?.title || g?.title || 'Género');
                                            return (
                                                <View key={i} style={s.genreBadge}>
                                                    <Text style={s.genreText}>{label}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Synopsis inside hero without container */}
                        {!!tr.description && (
                            <Text style={s.heroDescription}>{tr.description}</Text>
                        )}
                    </Animated.View>
                </View>

                {/* Asymmetrical Cyber Action Row with smaller, sleeker buttons */}
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
                        activeOpacity={0.8}
                    >
                        <Play size={16} fill="#050214" color="#050214" />
                        <Text style={s.playBtnText}>{canPlay ? 'REPRODUCIR' : 'PRÓXIMAMENTE'}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[s.circleBtn, isFavorited && s.circleBtnActive]} onPress={toggleFav} activeOpacity={0.8}>
                        {isFavorited ? <Check size={18} color="#D946EF" /> : <Plus size={18} color="#00FF9D" />}
                    </TouchableOpacity>

                    <TouchableOpacity style={[s.circleBtn, isLiked && s.circleBtnActive]} onPress={toggleLike} activeOpacity={0.8}>
                        <ThumbsUp size={16} fill={isLiked ? '#00FF9D' : 'none'} color={isLiked ? '#00FF9D' : '#FFFFFF'} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Seasons & Episodes with modern thumbnail cards */}
                {isSeries && content.seasons?.length > 0 && (
                    <View style={s.section}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.seasonScroll}>
                            {content.seasons.map((se: any, i: number) => (
                                <TouchableOpacity key={se.id} style={[s.seasonTab, i === selectedSeason && s.seasonTabActive]} onPress={() => setSelectedSeason(i)}>
                                    <Text style={[s.seasonTabText, i === selectedSeason && s.seasonTabTextActive]}>Temporada {se.number}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {(currentSeason?.episodes || []).map((ep: any) => {
                            const epThumb = resolveImageUrl(
                                ep.thumbnails?.find((t: any) => t.type === 'THUMBNAIL' || t.type === 'BACKDROP')?.url || 
                                ep.thumbnails?.[0]?.url || 
                                ep.thumbnailUrl || 
                                ep.imageUrl || 
                                backdrop
                            );
                            const epTitle = ep.translations?.[0]?.title || `Episodio ${ep.number}`;
                            const epDesc = ep.translations?.[0]?.description || 'Sin descripción disponible para este episodio.';

                            return (
                                <View key={ep.id} style={{ marginBottom: 14 }}>
                                    <TouchableOpacity
                                        style={s.epCard}
                                        onPress={() => {
                                            if (!user) {
                                                router.push('/(auth)/login' as any);
                                            } else {
                                                router.push(`/watch/${id}?episodeId=${ep.id}` as any);
                                            }
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={s.epThumbWrap}>
                                            <Image source={epThumb} style={s.epThumbImg} contentFit="cover" transition={300} />
                                            <View style={s.epNumBadge}>
                                                <Text style={s.epNumBadgeText}>{ep.number}</Text>
                                            </View>
                                            <View style={s.epPlayOverlay}>
                                                <Play size={14} fill="#FFFFFF" color="#FFFFFF" />
                                            </View>
                                        </View>
                                        
                                        <View style={s.epInfoWrap}>
                                            <Text style={s.epTitle} numberOfLines={1}>{epTitle}</Text>
                                            <Text style={s.epDesc} numberOfLines={2}>{epDesc}</Text>
                                            {!!ep.duration && (
                                                <Text style={s.epDuration}>{ep.duration} min</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Cast */}
                {(content.actors || []).length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionLabel}>Reparto</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {content.actors.slice(0, 8).map((a: any, i: number) => (
                                <View key={i} style={s.actorCard}>
                                    <View style={s.actorImgWrap}>
                                        <Image source={resolveImageUrl(a.actor.photoUrl)} style={s.actorImg} contentFit="cover" />
                                    </View>
                                    <Text style={s.actorName} numberOfLines={1}>{a.actor.name}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Related */}
                {related.length > 0 && (
                    <FilmRow
                        title="Contenidos Relacionados"
                        items={related.map(item => ({
                            id: item.id, title: item.translations?.[0]?.title || item.slug,
                            posterUrl: resolveImageUrl(item.thumbnails?.find((t: any) => t.type === 'POSTER')?.url),
                            backdropUrl: resolveImageUrl(item.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url),
                            rating: item.rating, year: item.releaseYear, type: item.type,
                        }))}
                        accentColor="#D946EF"
                    />
                )}
            </ScrollView>
        </FuturisticBackground>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    hero: { 
        minHeight: SW * 1.3, 
        position: 'relative', 
        justifyContent: 'flex-end', 
        paddingBottom: 70,
    },
    heroBgCurveWrap: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050214',
    },
    heroBg: { ...StyleSheet.absoluteFillObject, opacity: 0.85 },
    backBtn: { position: 'absolute', left: 16, zIndex: 100 },
    backPod: { 
        width: 40, 
        height: 40, 
        borderTopLeftRadius: 16, 
        borderBottomRightRadius: 16, 
        borderTopRightRadius: 6, 
        borderBottomLeftRadius: 6, 
        backgroundColor: '#0F0826', 
        borderWidth: 1.5, 
        borderColor: '#D946EF', 
        justifyContent: 'center', 
        alignItems: 'center',
        shadowColor: '#D946EF',
        shadowRadius: 6,
        shadowOpacity: 0.5,
        elevation: 6,
    },
    heroContentWrap: { paddingHorizontal: 20, paddingTop: 80, paddingBottom: 10 },
    heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    mainPosterWrap: { 
        width: 125, 
        height: 180, 
        borderTopLeftRadius: 22, 
        borderBottomRightRadius: 22, 
        borderTopRightRadius: 8, 
        borderBottomLeftRadius: 8, 
        overflow: 'hidden', 
        borderWidth: 2, 
        borderColor: '#D946EF',
        backgroundColor: '#0F0826',
    },
    mainPoster: { width: '100%', height: '100%', zIndex: 2 },
    posterGlow: { position: 'absolute', bottom: -20, right: -20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#D946EF', opacity: 0.4 },
    heroInfo: { flex: 1, paddingBottom: 4 },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0, 255, 157, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderTopLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderColor: '#00FF9D' },
    typeText: { fontSize: scale(9.5), fontWeight: '900', color: '#00FF9D', textTransform: 'uppercase', letterSpacing: 1.2 },
    adultBadge: { backgroundColor: 'rgba(255, 51, 102, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#FF3366' },
    adultText: { fontSize: scale(9.5), fontWeight: '900', color: '#FF3366' },
    heroTitle: { fontSize: scale(28), fontWeight: '900', color: Colors.white, textTransform: 'uppercase', lineHeight: 25, marginBottom: 8, letterSpacing: 0.5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { fontSize: scale(16), fontWeight: '800', color: 'rgba(255, 255, 255, 0.75)' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D946EF' },
    ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(250, 204, 21, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#FACC15' },
    ratingVal: { fontSize: 11, fontWeight: '900', color: '#FACC15' },
    genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    genreBadge: { backgroundColor: 'rgba(217, 70, 239, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 0.8, borderColor: '#D946EF' },
    genreText: { fontSize: scale(12), fontWeight: '700', color: '#FFFFFF' },
    heroDescription: { fontSize: scale(15.5), color: 'rgba(255, 255, 255, 0.88)', lineHeight: 19, marginTop: 14, fontWeight: '500', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, marginTop: -36, marginBottom: 60 },
    playBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        paddingHorizontal: 24,
        backgroundColor: '#00FF9D', 
        height: 44, 
        borderTopLeftRadius: 18, 
        borderBottomRightRadius: 18, 
        borderTopRightRadius: 8, 
        borderBottomLeftRadius: 8, 
        shadowColor: '#00FF9D', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.6, 
        shadowRadius: 12, 
        elevation: 6 
    },
    playBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.15)', shadowOpacity: 0 },
    playBtnText: { fontSize: scale(12), fontWeight: '900', color: '#050214', textTransform: 'uppercase', letterSpacing: 1.2 },
    circleBtn: { 
        width: 44, 
        height: 44, 
        borderTopLeftRadius: 16, 
        borderBottomRightRadius: 16, 
        borderTopRightRadius: 8, 
        borderBottomLeftRadius: 8, 
        backgroundColor: '#0F0826', 
        borderWidth: 1.5, 
        borderColor: 'rgba(217, 70, 239, 0.4)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    circleBtnActive: { backgroundColor: 'rgba(217, 70, 239, 0.25)', borderColor: '#D946EF', shadowColor: '#D946EF', shadowRadius: 8, shadowOpacity: 0.8, elevation: 6 },
    
    section: { paddingHorizontal: 20, marginBottom: 28 },
    sectionLabel: { fontSize: scale(12), fontWeight: '900', color: '#00FF9D', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14, marginLeft: 4 },
    seasonScroll: { marginBottom: 16 },
    seasonTab: { paddingHorizontal: 16, paddingVertical: 8, borderTopLeftRadius: 14, borderBottomRightRadius: 14, borderTopRightRadius: 6, borderBottomLeftRadius: 6, backgroundColor: '#0F0826', marginRight: 10, borderWidth: 1.5, borderColor: 'rgba(217, 70, 239, 0.3)' },
    seasonTabActive: { backgroundColor: '#D946EF', borderColor: '#D946EF', shadowColor: '#D946EF', shadowRadius: 6, shadowOpacity: 0.8, elevation: 4 },
    seasonTabText: { fontSize: scale(12), fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)' },
    seasonTabTextActive: { color: '#FFFFFF', fontWeight: '900' },
    
    epCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        padding: 10, 
        backgroundColor: 'rgba(15, 8, 38, 0.5)', 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: 'rgba(217, 70, 239, 0.25)',
    },
    epThumbWrap: { 
        width: 115, 
        height: 65, 
        borderRadius: 12, 
        overflow: 'hidden', 
        backgroundColor: '#050214', 
        position: 'relative', 
        borderWidth: 1, 
        borderColor: 'rgba(0, 255, 157, 0.3)',
    },
    epThumbImg: { width: '100%', height: '100%' },
    epNumBadge: { position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(5, 2, 20, 0.85)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, borderWidth: 0.8, borderColor: '#00FF9D' },
    epNumBadgeText: { fontSize: scale(8.5), fontWeight: '900', color: '#00FF9D' },
    epPlayOverlay: { position: 'absolute', top: '50%', left: '50%', marginTop: -13, marginLeft: -13, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(217, 70, 239, 0.85)', justifyContent: 'center', alignItems: 'center', shadowColor: '#D946EF', shadowRadius: 4, shadowOpacity: 0.8, elevation: 3 },
    epInfoWrap: { flex: 1, justifyContent: 'center' },
    epTitle: { fontSize: scale(13.5), fontWeight: '800', color: Colors.white, marginBottom: 3 },
    epDesc: { fontSize: scale(11), color: 'rgba(255, 255, 255, 0.65)', lineHeight: 15, marginBottom: 3 },
    epDuration: { fontSize: scale(10), fontWeight: '700', color: '#00FF9D' },
    
    actorCard: { alignItems: 'center', marginRight: 16, width: 80 },
    actorImgWrap: { 
        width: 72, 
        height: 72, 
        marginBottom: 8, 
        borderTopLeftRadius: 28, 
        borderBottomRightRadius: 28, 
        borderTopRightRadius: 8, 
        borderBottomLeftRadius: 8, 
        overflow: 'hidden', 
        borderWidth: 2, 
        borderColor: '#D946EF',
        backgroundColor: '#0F0826',
    },
    actorImg: { width: '100%', height: '100%' },
    actorName: { fontSize: scale(11), fontWeight: '700', color: Colors.white, textAlign: 'center' },
});
