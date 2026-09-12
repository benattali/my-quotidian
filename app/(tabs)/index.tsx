import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/AuthContext';
import { QuoteCard } from '@/components/QuoteCard';
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
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.accent} size="large" />
        ) : quote ? (
          <>
            <Text style={styles.kicker}>QUOTE OF THE DAY</Text>
            <QuoteCard
              quote={quote}
              favorited={favorited}
              onToggleFavorite={onToggle}
              large
            />
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
    padding: spacing.lg,
    gap: spacing.md,
  },
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  empty: { color: colors.muted, fontSize: 16, textAlign: 'center' },
});
