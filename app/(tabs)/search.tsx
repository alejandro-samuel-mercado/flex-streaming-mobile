import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, X, ArrowLeft } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { API_ROUTES, resolveImageUrl } from '../../lib/api-routes';
import { fetchApi } from '../../lib/api-client';
import { getContentTypeLabel } from '../../lib/content-types';
import { isTV, scale, UI_SPACING } from '../../lib/responsive';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const json = await fetchApi<any>(`${API_ROUTES.CONTENT.LIST}?search=${encodeURIComponent(query)}&limit=20`);
        if (json.success) setResults(json.data);
      } catch (e) { console.error(e); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const bottomPadding = insets.bottom > 0 ? insets.bottom + 90 : 110;

  return (
    <View style={[s.screen, { paddingTop: insets.top + 30 }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={scale(22)} color={Colors.white} /></TouchableOpacity>
        <View style={s.searchBar}>
          <SearchIcon size={scale(18)} color={Colors.textMuted} />
          <TextInput 
            style={s.input} 
            placeholder="Películas, series, actores..." 
            placeholderTextColor={Colors.textMuted} 
            value={query} 
            onChangeText={setQuery} 
            autoFocus 
          />
          {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')}><X size={scale(18)} color={Colors.textMuted} /></TouchableOpacity>}
        </View>
      </View>

      {searching && <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />}

      {!query && (
        <View style={s.empty}><SearchIcon size={scale(48)} color="rgba(255,255,255,0.1)" /><Text style={s.emptyText}>Encuentra tus películas favoritas</Text></View>
      )}

      <FlatList 
        data={results} 
        keyExtractor={(item) => item.id} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: UI_SPACING.horizontal, paddingTop: 12, paddingBottom: bottomPadding }}
        renderItem={({ item }) => {
          const poster = item.thumbnails?.find((t: any) => t.type === 'POSTER')?.url;
          return <SearchResultItem item={item} poster={poster} />;
        }}
      />
    </View>
  );
}

function SearchResultItem({ item, poster }: any) {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const scaleV = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleV.value }],
    backgroundColor: isFocused ? 'rgba(255,255,255,0.08)' : 'transparent',
    borderColor: isFocused ? Colors.primary : 'transparent',
    borderWidth: 1,
  }));

  return (
    <Pressable
      onFocus={() => { setIsFocused(true); scaleV.value = withSpring(1.05); }}
      onBlur={() => { setIsFocused(false); scaleV.value = withSpring(1); }}
      onPress={() => router.push(`/film/${item.id}` as any)}
    >
      <Animated.View style={[s.resultRow, animatedStyle]}>
        <Image source={{ uri: resolveImageUrl(poster) }} style={s.resultImg} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <Text style={s.resultTitle} numberOfLines={1}>{item.translations?.[0]?.title || item.slug}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Text style={s.resultMeta}>{getContentTypeLabel(item.type)}</Text>
            {item.releaseYear && <Text style={s.resultMeta}>{item.releaseYear}</Text>}
            {item.rating > 0 && <Text style={[s.resultMeta, { color: Colors.primary }]}>★ {item.rating.toFixed(1)}</Text>}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: UI_SPACING.horizontal, marginBottom: scale(8) },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 14, height: scale(48, 1.2) },
  input: { flex: 1, color: Colors.white, fontSize: scale(15) },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textMuted, fontSize: 16, marginTop: 12 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 8, borderRadius: 12, marginBottom: 4 },
  resultImg: { width: 50, height: 70, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  resultTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  resultMeta: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
});
