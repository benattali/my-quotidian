import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HEART_OUTLINE = require('../../assets/icons/heart-outline.png');

import { useAuth } from '@/AuthContext';
import { QuoteCard } from '@/components/QuoteCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import {
  subscribeFavorites,
  subscribeTodaysQuote,
  toggleFavorite,
} from '@/quotes';
import { DailyQuote } from '@/types';
import { colors, spacing } from '@/theme';

export default function Today() {
  const { user } = useAuth();
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = subscribeTodaysQuote((q) => {
      setQuote(q);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeFavorites(user.uid, (favs) => {
      setFavoriteIds(new Set(favs.map((f) => f.id)));
    });
    return unsub;
  }, [user]);

  const favorited = useMemo(
    () => (quote ? favoriteIds.has(quote.id) : false),
    [quote, favoriteIds],
  );

  async function onToggle() {
    if (!user || !quote) return;
    try {
      await toggleFavorite(user.uid, quote);
    } catch (e) {
      Alert.alert('Could not update favorite', (e as Error).message);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="Today" />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.accent} size="large" />
        ) : quote ? (
          <>
            <QuoteCard
              quote={quote}
              favorited={favorited}
              onToggleFavorite={onToggle}
              large
            />
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Tap the{' '}
                <Image source={HEART_OUTLINE} style={styles.bannerHeart} />
                {' '}to save this quote to your Favorites
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.empty}>
            No quote yet — check back once today’s quote has been published.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    justifyContent: 'center',
    // Extra horizontal room so the corner quote marks poke into the margin
    // rather than off the screen edge.
    paddingHorizontal: 56,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  banner: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  bannerText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  bannerHeart: { width: 15, height: 15 },
  empty: { color: colors.muted, fontSize: 16, textAlign: 'center' },
});
