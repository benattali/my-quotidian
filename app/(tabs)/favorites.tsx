import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/AuthContext';
import { QuoteCard } from '@/components/QuoteCard';
import { subscribeFavorites, toggleFavorite } from '@/quotes';
import { Favorite } from '@/types';
import { colors, spacing } from '@/theme';

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeFavorites(user.uid, (favs) => {
      setFavorites(favs);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {!loading && favorites.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🤍</Text>
          <Text style={styles.empty}>
            Tap the heart on any quote to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <QuoteCard
              quote={item}
              favorited
              onToggleFavorite={() => {
                if (user) void toggleFavorite(user.uid, item);
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  // Extra horizontal room (so corner marks clear the screen edge) and vertical
  // gap (so they don't overlap neighbours).
  list: { paddingHorizontal: 56, paddingVertical: spacing.lg, gap: 48 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  empty: {
    color: colors.muted,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
