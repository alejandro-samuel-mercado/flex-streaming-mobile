import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Dimensions, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { fetchApi } from '../../lib/api-client';
import { Search, X, ListFilter } from 'lucide-react-native';
import { getContentTypeLabel, CONTENT_TYPES_LIST } from '../../lib/content-types';
import FilmCard from '../../components/catalog/FilmCard';
import Animated, { FadeIn, FadeOut, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { isTV, scale, UI_SPACING } from '../../lib/responsive';

const { width: SW } = Dimensions.get('window');
const COLS = isTV ? 5 : 3;
const GAP = isTV ? 20 : 8;
const CARD_W = (SW - (UI_SPACING.horizontal * 2) - GAP * (COLS - 1)) / COLS;

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 80 : 100;
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [genreId, setGenreId] = useState<string | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [genres, setGenres] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [gRes, pRes] = await Promise.all([
          fetchApi<any>(API_ROUTES.CATEGORIES.GENRES),
          fetchApi<any>(API_ROUTES.PLATFORMS.LIST)
        ]);
        if (gRes.success) setGenres(gRes.data);
        if (pRes.success) setPlatforms(pRes.data);
      } catch (e) { console.error('Metadata fetch error:', e); }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: page.toString(), limit: '30', sort: 'az' });
        if (search) params.set('search', search);
        if (type) params.set('type', type);
        if (genreId) params.set('genreId', genreId);
        if (platformId) params.set('platformId', platformId);
        
        const json = await fetchApi<any>(`${API_ROUTES.CONTENT.LIST}?${params}`);
        if (json.success) { setContent(json.data); setTotal(json.meta?.total || json.pagination?.total || 0); }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [page, search, type, genreId, platformId]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const poster = item.thumbnails?.find((t: any) => t.type === 'POSTER')?.url;
    return (
      <FilmCard
        id={item.id}
        title={item.translations?.[0]?.title || item.slug}
        posterUrl={poster}
        rating={item.rating}
        year={item.releaseYear}
        type={item.type}
        width={CARD_W}
      />
    );
  }, [CARD_W]);

  return (
    <View style={[s.screen, { paddingTop: insets.top + 50 }]}>
      <Text style={s.title}>Explorar</Text>
      
      <View style={s.searchBarContainer}>
        <View style={s.searchBar}>
          <Search size={scale(18)} color={Colors.primary} />
          <TextInput 
            style={s.searchInput} 
            placeholder="Películas, series, géneros..." 
            placeholderTextColor={Colors.textMuted} 
            value={search} 
            onChangeText={setSearch} 
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={scale(18)} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[s.filterToggle, showFilters && s.filterToggleActive]} 
          onPress={() => setShowFilters(!showFilters)}
        >
          <ListFilter size={scale(20)} color={showFilters ? Colors.black : Colors.primary} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={Layout} style={s.filtersWrapper}>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Tipo</Text>
            <FlatList
              data={[{ type: null, label: 'Todos' }, ...(CONTENT_TYPES_LIST || []).map(t => ({ type: t, label: getContentTypeLabel(t) }))]}
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterRow}
              renderItem={({ item: f }) => (
                <FilterChip 
                  label={f.label} 
                  active={type === f.type} 
                  onPress={() => { setType(f.type); setPage(1); }} 
                />
              )}
              keyExtractor={(item) => item.type || 'all'}
            />
          </View>

          {genres.length > 0 && (
            <View style={s.filterGroup}>
              <Text style={s.filterLabel}>Géneros</Text>
              <FlatList
                data={[{ id: null, name: 'Todos' }, ...genres]}
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.filterRow}
                renderItem={({ item: g }) => (
                  <FilterChip 
                    label={g.name} 
                    active={genreId === g.id} 
                    onPress={() => { setGenreId(g.id); setPage(1); }} 
                  />
                )}
                keyExtractor={(item) => item.id || 'all'}
              />
            </View>
          )}

          {platforms.length > 0 && (
            <View style={s.filterGroup}>
              <Text style={s.filterLabel}>Plataformas</Text>
              <FlatList
                data={[{ id: null, name: 'Todas' }, ...platforms]}
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.filterRow}
                renderItem={({ item: p }) => (
                  <FilterChip 
                    label={p.name} 
                    active={platformId === p.id} 
                    onPress={() => { setPlatformId(p.id); setPage(1); }} 
                  />
                )}
                keyExtractor={(item) => item.id || 'all'}
              />
            </View>
          )}
        </Animated.View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={content}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ paddingHorizontal: UI_SPACING.horizontal, paddingTop: 8, gap: GAP, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Sin resultados</Text></View>}
        />
      )}
    </View>
  );
}

function FilterChip({ label, active, onPress }: any) {
  const [isFocused, setIsFocused] = useState(false);
  const scaleV = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleV.value }],
    borderColor: isFocused ? Colors.primary : (active ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.05)'),
    backgroundColor: isFocused ? 'rgba(0,229,255,0.05)' : (active ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.03)'),
    borderWidth: isFocused ? 2 : 1,
  }));

  return (
    <Pressable
      onFocus={() => { setIsFocused(true); scaleV.value = withSpring(1.1); }}
      onBlur={() => { setIsFocused(false); scaleV.value = withSpring(1); }}
      onPress={onPress}
    >
      <Animated.View style={[s.filterChip, animatedStyle]}>
        <Text style={[s.filterText, active && s.filterTextActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  title: { fontSize: scale(28), fontWeight: '900', color: Colors.white, marginLeft: UI_SPACING.horizontal, marginBottom: scale(20), textTransform: 'uppercase', letterSpacing: 2 },
  searchBarContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: UI_SPACING.horizontal, marginBottom: scale(20) },
  searchBar: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: scale(52, 1.2),
  },
  filterToggle: { 
    width: scale(52, 1.2), 
    height: scale(52, 1.2), 
    borderRadius: 16, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  filterToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filtersWrapper: { backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 16, marginBottom: 16 },
  filterGroup: { marginBottom: 16 },
  filterLabel: { fontSize: scale(10), fontWeight: '900', color: Colors.primarySoft, textTransform: 'uppercase', letterSpacing: 2, marginLeft: UI_SPACING.horizontal, marginBottom: 8 },
  filterRow: { paddingHorizontal: UI_SPACING.horizontal, gap: scale(8) },
  searchInput: { flex: 1, color: Colors.white, fontSize: scale(15), fontWeight: '600' },
  filterChip: { 
    paddingHorizontal: scale(18), 
    paddingVertical: scale(10), 
    borderRadius: 12, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: { fontSize: scale(13), fontWeight: '700', color: Colors.textMuted },
  filterTextActive: { color: Colors.primary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: scale(16), fontWeight: '600' },
});
