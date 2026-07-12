import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Star, Play } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { getContentTypeLabel } from '../../lib/content-types';
import { isTV, scale, UI_SPACING } from '../../lib/responsive';
import FilmCard from './FilmCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 112;
const CARD_WIDTH_LARGE = 124;

interface FilmItem {
  id: string;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating?: number | null;
  year?: number | null;
  type?: string;
  duration?: number | null;
  genres?: string[];
  customLink?: string;
  progress?: number;
}

interface FilmRowProps {
  title: string;
  subtitle?: string;
  items: FilmItem[];
  variant?: 'default' | 'large' | 'numbered';
  accentColor?: string;
}

export default function FilmRow({ title, subtitle, items, variant = 'default', accentColor }: FilmRowProps) {
  const router = useRouter();
  const cardW = variant === 'large' ? CARD_WIDTH_LARGE : CARD_WIDTH;

  if (items.length === 0) return null;

  const renderItem = useCallback(({ item }: { item: FilmItem }) => {
    return (
      <FilmCard
        id={item.id}
        title={item.title}
        posterUrl={item.posterUrl || item.backdropUrl}
        rating={item.rating || undefined}
        year={item.year || undefined}
        type={item.type}
        width={isTV ? 220 : cardW}
        progress={item.progress}
        duration={item.duration || undefined}
      />
    );
  }, [cardW]);

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, accentColor ? { color: accentColor } : undefined]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {/* Scrollable Row */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={cardW + 12}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: scale(32),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: UI_SPACING.horizontal,
    marginBottom: scale(16),
  },
  title: {
    fontSize: scale(20, 1.8),
    fontWeight: '900',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: scale(12, 1.5),
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: UI_SPACING.horizontal,
    gap: scale(12),
  },
  card: {
    position: 'relative',
  },
  numberBadge: {
    position: 'absolute',
    left: -8,
    bottom: 60,
    zIndex: 10,
  },
  numberText: {
    fontSize: 64,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.08)',
    fontStyle: 'italic',
  },
  imageWrap: {
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  info: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.rating,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
});
