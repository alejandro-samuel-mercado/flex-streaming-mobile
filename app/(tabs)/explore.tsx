import { useRouter } from 'expo-router';
import { ListFilter, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FilmCard from '../../components/catalog/FilmCard';
import { fetchApi } from '../../lib/api-client';
import { API_ROUTES } from '../../lib/api-routes';
import { CONTENT_TYPES_LIST, getContentTypeLabel } from '../../lib/content-types';
import { isTV, scale, UI_SPACING } from '../../lib/responsive';
import { Colors } from '../../theme/colors';

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [genreId, setGenreId] = useState<string | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [genres, setGenres] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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
      if (page === 1) setLoading(true);
      try {
        const p = new URLSearchParams();
        p.append('page', String(page));
        p.append('limit', '30');
        p.append('sort', 'recent');
        if (search) p.append('search', search);
        if (type) p.set('type', type);
        if (genreId) p.set('genreId', genreId);
        if (platformId) p.set('platformId', platformId);
        
        const json = await fetchApi<any>(`${API_ROUTES.CONTENT.LIST}?${p}`);
        if (json.success) { 
          const newData = json.data || [];
          setContent(prev => page === 1 ? newData : [...prev, ...newData]); 
          setTotal(json.meta?.total || json.pagination?.total || 0); 
          setHasMore(newData.length === 30);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
      setIsLoadingMore(false);
    };
    
    // Si estamos cambiando de página (scroll infinito), cargamos sin delay.
    // Solo usamos debounce (300ms) cuando se escribe en la búsqueda o se cambia un filtro.
    const delay = page === 1 ? 300 : 0;
    const t = setTimeout(load, delay);
    return () => clearTimeout(t);
  }, [page, search, type, genreId, platformId]);

  // Reset page and hasMore when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [search, type, genreId, platformId]);

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
          <Search size={scale(22)} color={Colors.primary} />
          <TextInput 
            style={s.searchInput} 
            placeholder="Películas, series, géneros..." 
            placeholderTextColor={Colors.textMuted} 
            value={search} 
            onChangeText={setSearch} 
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={scale(22)} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[s.filterToggle, showFilters && s.filterToggleActive]} 
          onPress={() => setShowFilters(!showFilters)}
        >
          <ListFilter size={scale(24)} color={showFilters ? Colors.black : Colors.primary} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <Pressable style={s.modalOverlay} onPress={() => setShowFilters(false)}>
            <View style={s.modalContent} onStartShouldSetResponder={() => true}>
              <View style={s.filterHeader}>
                <Text style={s.modalTitle}>Filtros</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <X size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{maxHeight: SW * 1.2}} showsVerticalScrollIndicator={false}>
                <View style={s.filterGroup}>
                  <Text style={s.filterLabel}>Tipo</Text>
                  <View style={s.filterRow}>
                    {[{ type: null, label: 'Todos' }, ...(CONTENT_TYPES_LIST || []).map(t => ({ type: t, label: getContentTypeLabel(t) }))].map(f => (
                      <FilterChip 
                        key={f.type || 'all'}
                        label={f.label} 
                        active={type === f.type} 
                        onPress={() => { setType(f.type); setPage(1); }} 
                      />
                    ))}
                  </View>
                </View>

                {genres.length > 0 && (
                  <View style={s.filterGroup}>
                    <Text style={s.filterLabel}>Géneros</Text>
                    <View style={s.filterRow}>
                      {[{ id: null, name: 'Todos' }, ...genres].map(g => (
                        <FilterChip 
                          key={g.id || 'all'}
                          label={g.name} 
                          active={genreId === g.id} 
                          onPress={() => { setGenreId(g.id); setPage(1); }} 
                        />
                      ))}
                    </View>
                  </View>
                )}

                {platforms.length > 0 && (
                  <View style={s.filterGroup}>
                    <Text style={s.filterLabel}>Plataformas</Text>
                    <View style={s.filterRow}>
                      {[{ id: null, name: 'Todas' }, ...platforms].map(p => (
                        <FilterChip 
                          key={p.id || 'all'}
                          label={p.name} 
                          active={platformId === p.id} 
                          onPress={() => { setPlatformId(p.id); setPage(1); }} 
                        />
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </Pressable>
        </View>
      )}

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          key={COLS}
          data={content}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={COLS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ paddingHorizontal: UI_SPACING.horizontal, paddingTop: 8, gap: GAP, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Sin resultados</Text></View>}
          onEndReached={() => {
            if (!loading && !isLoadingMore && hasMore) {
              setIsLoadingMore(true);
              setPage(p => p + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <View style={{ height: 60, alignItems: 'center', justifyContent: 'center' }}>
              {isLoadingMore && <ActivityIndicator size="large" color={Colors.primary} />}
            </View>
          }
        />
      )}
    </View>
  );
}

function FilterChip({ label, active, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        s.filterChip,
        {
          borderColor: active ? Colors.primary : 'rgba(255,255,255,0.1)',
          backgroundColor: active ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
        }
      ]}
    >
      <Text style={[s.filterText, active && s.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
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
    height: scale(64, 1.2),
  },
  filterToggle: { 
    width: scale(64, 1.2), 
    height: scale(64, 1.2), 
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#111', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: Colors.white, fontSize: scale(18), fontWeight: 'bold' },
  filterGroup: { marginBottom: 20 },
  filterLabel: { fontSize: scale(11), fontWeight: '900', color: Colors.primarySoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
  searchInput: { flex: 1, color: Colors.white, fontSize: scale(18), fontWeight: '600' },
  filterChip: { 
    paddingHorizontal: scale(16), 
    paddingVertical: scale(10), 
    borderRadius: 10, 
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: { fontSize: scale(14), fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: Colors.primary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: scale(16), fontWeight: '600' },
});
