import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { Storage, StorageKeys } from '../../lib/storage';
import { fetchApi } from '../../lib/api-client';
import { Heart } from 'lucide-react-native';
import FilmCard from '../../components/catalog/FilmCard';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 8;
const CW = (SW - 32 - GAP * (COLS - 1)) / COLS;

export default function FavoritesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [favs, setFavs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [hasToken, setHasToken] = useState<boolean | null>(null);

    useEffect(() => {
        const load = async () => {
            const token = await Storage.get(StorageKeys.ACCESS_TOKEN);
            setHasToken(!!token);
            if (!token) { setLoading(false); return; }

            try {
                const json = await fetchApi<any>(API_ROUTES.FAVORITES.BASE);
                if (json.success && json.data) setFavs(json.data.data || []);
            } catch (e) {
                console.error(e);
                setFavs([]);
            }
            setLoading(false);
        };
        load();
    }, []);

    if (hasToken === false && !loading) {
        return (
            <View style={s.screen}>
                <Text style={s.title}>Mis Favoritos</Text>
                <View style={s.empty}>
                    <Heart size={48} color="rgba(255,255,255,0.1)" />
                    <Text style={s.emptyTitle}>Iniciá sesión</Text>
                    <Text style={s.emptyText}>Debes estar identificado para ver tus favoritos guardados.</Text>
                    <TouchableOpacity style={s.cta} onPress={() => router.push('/(auth)/login' as any)}>
                        <Text style={s.ctaText}>Iniciar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={s.screen}>
            <Text style={s.title}>Mis Favoritos</Text>
            <Text style={s.sub}>Tus títulos guardados para ver más tarde.</Text>
            {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : favs.length > 0 ? (
                <FlatList data={favs} numColumns={COLS} columnWrapperStyle={{ gap: GAP }} contentContainerStyle={{ paddingHorizontal: 16, gap: GAP, paddingBottom: insets.bottom > 0 ? insets.bottom + 80 : 100 }} showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const poster = item.thumbnails?.find((t: any) => t.type === 'POSTER')?.url;
                        return (
                            <FilmCard
                                id={item.id}
                                title={item.translations?.[0]?.title || item.slug}
                                posterUrl={poster}
                                rating={item.rating}
                                year={item.releaseYear}
                                type={item.type}
                            />
                        );
                    }}
                />
            ) : (
                <View style={s.empty}>
                    <Heart size={48} color="rgba(255,255,255,0.1)" />
                    <Text style={s.emptyTitle}>Aún no agregaste títulos.</Text>
                    <Text style={s.emptyText}>Añade películas y series a tu lista.</Text>
                    <TouchableOpacity style={s.cta} onPress={() => router.push('/(tabs)/explore' as any)}><Text style={s.ctaText}>Descubrir contenido</Text></TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
    title: { fontSize: 28, fontWeight: '900', color: Colors.white, paddingHorizontal: 16, marginBottom: 4 },
    sub: { fontSize: 13, color: Colors.textMuted, paddingHorizontal: 16, marginBottom: 20 },
    cardTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginTop: 6, paddingHorizontal: 2 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginTop: 16, marginBottom: 4 },
    emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
    cta: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    ctaText: { fontSize: 14, fontWeight: '900', color: Colors.black, textTransform: 'uppercase' },
});
