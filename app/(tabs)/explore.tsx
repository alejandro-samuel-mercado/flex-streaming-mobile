import { useRouter, useLocalSearchParams } from 'expo-router';
import { ListFilter, Search, X, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FilmCard from '../../components/catalog/FilmCard';
import { FuturisticBackground } from '../../components/ui/FuturisticBackground';
import { fetchApi } from '../../lib/api-client';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { CONTENT_TYPES_LIST, getContentTypeLabel } from '../../lib/content-types';
import { handleNavScroll } from '../../lib/nav-state';
import { isTV, scale, UI_SPACING } from '../../lib/responsive';
import { Colors } from '../../theme/colors';

const { width: SW } = Dimensions.get('window');
const COLS = isTV ? 5 : 3;
const GAP = scale(12);
const CARD_W = Math.floor((SW - (UI_SPACING.horizontal * 2) - (GAP * (COLS - 1))) / COLS);

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | null>((params.type as string) || null);
  const [genreId, setGenreId] = useState<string | null>((params.genreId as string) || null);
  const [platformId, setPlatformId] = useState<string | null>((params.platformId as string) || null);
  const [genres, setGenres] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);

  useEffect(() => {
    if (params.type !== undefined) {
      setType((params.type as string) || null);
    }
    if (params.genreId !== undefined) {
      setGenreId((params.genreId as string) || null);
    }
    if (params.platformId !== undefined) {
      setPlatformId((params.platformId as string) || null);
    } else if (params.platform && platforms.length > 0) {
      const slug = (params.platform as string).toLowerCase();
      const found = platforms.find((p: any) => p.slug?.toLowerCase() === slug || p.name?.toLowerCase() === slug || p.id?.toLowerCase() === slug);
      if (found) setPlatformId(found.id);
    }
    if (params.type !== undefined || params.genreId !== undefined || params.platformId !== undefined || params.platform !== undefined) {
      setPage(1);
    }
  }, [params.type, params.genreId, params.platformId, params.platform, platforms]);
  
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [showFilters, setShowFilters] = useState(false);

  const bottomPadding = insets.bottom > 0 ? insets.bottom + 90 : 110;

  useEffect(() => {
    const init = async () => {
      try {
        const [gJson, pJson] = await Promise.all([
          fetchApi<any>(API_ROUTES.CATEGORIES.GENRES),
          fetchApi<any>(API_ROUTES.PLATFORMS.LIST)
        ]);
        if (gJson.success) setGenres(gJson.data || []);
        if (pJson.success) setPlatforms(pJson.data || []);
      } catch (e) {}
    };
    init();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (page === 1) setLoading(true);
      try {
        const p = new URLSearchParams({ page: String(page), limit: '30' });
        if (search) p.append('search', search);

        let effectiveType = type;
        let effectiveGenreId = genreId;

        if (type === 'KIDS' || type === 'Infantil') {
          effectiveType = null;
          if (!effectiveGenreId) {
            const familiaGenre = genres.find((g: any) => g.name?.toLowerCase() === 'familia' || g.label?.toLowerCase() === 'familia' || g.name?.toLowerCase() === 'infantil' || g.label?.toLowerCase() === 'infantil' || g.name?.toLowerCase() === 'kids' || g.label?.toLowerCase() === 'kids');
            if (familiaGenre) effectiveGenreId = familiaGenre.id || familiaGenre.value;
          }
        } else if (type === 'KDRAMA' || type === 'K-Dramas') {
          effectiveType = null;
          if (!effectiveGenreId) {
            const dramaGenre = genres.find((g: any) => g.name?.toLowerCase() === 'drama' || g.label?.toLowerCase() === 'drama');
            if (dramaGenre) effectiveGenreId = dramaGenre.id || dramaGenre.value;
          }
        }

        if (effectiveType) p.set('type', effectiveType);
        if (effectiveGenreId) p.set('genreId', effectiveGenreId);
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
    
    const delay = page === 1 ? 250 : 0;
    const t = setTimeout(load, delay);
    return () => clearTimeout(t);
  }, [page, search, type, genreId, platformId, genres]);

  const renderItem = useCallback(({ item }: any) => {
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
        width={CARD_W}
      />
    );
  }, []);

  return (
    <FuturisticBackground showOrbs={true}>
      <View style={[s.screen, { paddingTop: insets.top + 10 }]}>
        {/* Asymmetrical Cyber Header */}
        <View style={s.cyberHeader}>
        
        </View>

        {/* Search Bar & Filter Button (Optimized static view without Blur for max FPS) */}
        <View style={s.searchBarContainer}>
          <View style={s.searchPod}>
            <Search color="#00D4FF" size={20} />
            <TextInput
              style={s.searchInput}
              placeholder="Buscar en el hiperespacio..."
              placeholderTextColor="rgba(255, 255, 255, 0.45)"
              value={search}
              onChangeText={(t) => { setSearch(t); setPage(1); }}
              returnKeyType="search"
            />
            {!!search && (
              <TouchableOpacity onPress={() => { setSearch(''); setPage(1); }} style={s.clearIcon}>
                <X color="#00FF9D" size={18} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[s.filterPod, (!!type || !!genreId || !!platformId) && s.filterPodActive]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}
          >
            <ListFilter color={(!!type || !!genreId || !!platformId) ? '#030818' : '#00FF9D'} size={22} />
          </TouchableOpacity>
        </View>

        {/* Active Filters Bar */}
        {(!!type || !!genreId || !!platformId) && (
          <View style={s.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.activeFiltersScroll}>
              {!!type && (
                <TouchableOpacity style={s.activeFilterChip} onPress={() => { setType(null); setPage(1); }}>
                  <Text style={s.activeFilterText}>
                    Tipo: {type === 'KIDS' ? 'Kids' : type === 'KDRAMA' ? 'K-Dramas' : getContentTypeLabel(type)}
                  </Text>
                  <X size={14} color="#030818" />
                </TouchableOpacity>
              )}
              {!!genreId && (
                <TouchableOpacity style={s.activeFilterChip} onPress={() => { setGenreId(null); setPage(1); }}>
                  <Text style={s.activeFilterText}>
                    Género: {genres.find((g: any) => g.id === genreId || g.value === genreId)?.name || genres.find((g: any) => g.id === genreId || g.value === genreId)?.label || 'Sector'}
                  </Text>
                  <X size={14} color="#030818" />
                </TouchableOpacity>
              )}
              {!!platformId && (
                <TouchableOpacity style={s.activeFilterChip} onPress={() => { setPlatformId(null); setPage(1); }}>
                  <Text style={s.activeFilterText}>
                    Plataforma: {platforms.find((p: any) => p.id === platformId || p.value === platformId)?.name || 'Red'}
                  </Text>
                  <X size={14} color="#030818" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={s.clearAllBtn}
                onPress={() => {
                  setType(null);
                  setGenreId(null);
                  setPlatformId(null);
                  setSearch('');
                  setPage(1);
                  router.setParams({ type: '', genreId: '', platformId: '', platform: '' });
                }}
              >
                <Text style={s.clearAllText}>Limpiar todo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Filter Native Modal */}
        <Modal transparent visible={showFilters} animationType="fade" onRequestClose={() => setShowFilters(false)}>
          <View style={s.modalOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setShowFilters(false)} 
            />
            <View style={s.modalBox}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>FILTROS CUÁNTICOS</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <X color="#FF3366" size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: SW * 1.2 }} showsVerticalScrollIndicator={false}>
                <View style={s.filterGroup}>
                  <Text style={s.filterLabel}>TIPO DE ARCHIVO</Text>
                  <View style={s.filterRow}>
                    <FilterChip label="Todos" active={!type} onPress={() => { setType(null); setPage(1); }} />
                    {CONTENT_TYPES_LIST.map((typeKey) => (
                      <FilterChip
                        key={typeKey}
                        label={getContentTypeLabel(typeKey)}
                        active={type === typeKey}
                        onPress={() => { setType(typeKey); setPage(1); }}
                      />
                    ))}
                  </View>
                </View>

                <View style={s.filterGroup}>
                  <Text style={s.filterLabel}>GÉNERO O SECTOR</Text>
                  <View style={s.filterRow}>
                    <FilterChip label="Todos" active={!genreId} onPress={() => { setGenreId(null); setPage(1); }} />
                    {genres.map((g) => (
                      <FilterChip
                        key={g.id}
                        label={g.name}
                        active={genreId === g.id}
                        onPress={() => { setGenreId(g.id); setPage(1); }}
                      />
                    ))}
                  </View>
                </View>

                <View style={s.filterGroup}>
                  <Text style={s.filterLabel}>PLATAFORMA ORIGEN</Text>
                  <View style={s.filterRow}>
                    <FilterChip label="Todas" active={!platformId} onPress={() => { setPlatformId(null); setPage(1); }} />
                    {platforms.map((p) => (
                      <FilterChip
                        key={p.id}
                        label={p.name}
                        active={platformId === p.id}
                        onPress={() => { setPlatformId(p.id); setPage(1); }}
                      />
                    ))}
                  </View>
                </View>

                <TouchableOpacity 
                  style={s.clearBtn} 
                  onPress={() => {
                    setType(null);
                    setGenreId(null);
                    setPlatformId(null);
                    setPage(1);
                    setShowFilters(false);
                  }}
                >
                  <Text style={s.clearBtnText}>RESETEAR FILTROS</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Content Grid */}
        {loading ? (
          <View style={s.loaderContainer}>
            <ActivityIndicator size="large" color="#00D4FF" />
            <Text style={s.loaderText}>Cargando..</Text>
          </View>
        ) : (
          <FlatList
            data={content}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            numColumns={COLS}
            columnWrapperStyle={{ gap: GAP }}
            contentContainerStyle={{ paddingHorizontal: UI_SPACING.horizontal, paddingTop: 8, gap: GAP, paddingBottom: bottomPadding }}
            showsVerticalScrollIndicator={false}
            onScroll={handleNavScroll}
            scrollEventThrottle={16}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Sin resultados en esta frecuencia</Text></View>}
            onEndReached={() => {
              if (!loading && !isLoadingMore && hasMore) {
                setIsLoadingMore(true);
                setPage(p => p + 1);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              <View style={{ height: 60, alignItems: 'center', justifyContent: 'center' }}>
                {isLoadingMore && <ActivityIndicator size="large" color="#00FF9D" />}
              </View>
            }
          />
        )}
      </View>
    </FuturisticBackground>
  );
}

function FilterChip({ label, active, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        s.filterChip,
        active ? s.filterChipActive : s.filterChipInactive
      ]}
    >
      <Text style={[s.filterText, active && s.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  cyberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_SPACING.horizontal,
    marginBottom: scale(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: scale(20), fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1.5 },
  countBadge: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF9D',
  },
  countText: { fontSize: scale(10), fontWeight: '900', color: '#00FF9D', letterSpacing: 1 },
  
  searchBarContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: UI_SPACING.horizontal, marginBottom: scale(16) },
  searchPod: {
    flex: 1,
    height: scale(54),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: '#081026',
    borderTopLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1.5,
    borderColor: '#00D4FF',
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: scale(15), fontWeight: '700' },
  clearIcon: { padding: 4 },
  filterPod: { 
    width: scale(54), 
    height: scale(54), 
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8, 
    backgroundColor: '#081026', 
    borderWidth: 1.5, 
    borderColor: '#00FF9D', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  filterPodActive: {
    backgroundColor: '#00FF9D',
    borderColor: '#00FF9D',
    shadowColor: '#00FF9D',
    shadowRadius: 12,
    shadowOpacity: 0.8,
    elevation: 8,
  },
  
  activeFiltersContainer: {
    marginBottom: scale(14),
  },
  activeFiltersScroll: {
    paddingHorizontal: UI_SPACING.horizontal,
    gap: 8,
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00FF9D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterText: {
    color: '#030818',
    fontSize: scale(12),
    fontWeight: '800',
  },
  clearAllBtn: {
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    borderWidth: 1,
    borderColor: '#FF3366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearAllText: {
    color: '#FF3366',
    fontSize: scale(12),
    fontWeight: '800',
  },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3, 8, 24, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 1000 },
  modalBox: {
    width: '94%',
    maxHeight: '85%',
    backgroundColor: '#081026',
    borderTopLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderWidth: 2,
    borderColor: '#00D4FF',
    padding: 24,
    shadowColor: '#00D4FF',
    shadowRadius: 20,
    shadowOpacity: 0.5,
    elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFFFFF', fontSize: scale(18), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  filterGroup: { marginBottom: 22 },
  filterLabel: { fontSize: scale(11), fontWeight: '900', color: '#00FF9D', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
  filterChip: { 
    paddingHorizontal: scale(14), 
    paddingVertical: scale(8), 
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4, 
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipInactive: {
    backgroundColor: 'rgba(8, 16, 38, 0.8)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  filterChipActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
    shadowColor: '#00D4FF',
    shadowRadius: 8,
    shadowOpacity: 0.8,
    elevation: 4,
  },
  filterText: { fontSize: scale(12), fontWeight: '700', color: 'rgba(255, 255, 255, 0.7)' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '900' },
  clearBtn: { marginTop: 20, backgroundColor: 'rgba(255, 51, 102, 0.15)', borderWidth: 1.5, borderColor: '#FF3366', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  clearBtnText: { color: '#FF3366', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: scale(16), fontWeight: '700' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  loaderText: { color: '#00D4FF', fontWeight: '800', letterSpacing: 1.5 },
});
