import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Quote } from '@/types';
import { colors, spacing } from '@/theme';

interface Props {
  quote: Quote;
  favorited: boolean;
  onToggleFavorite: () => void;
  large?: boolean;
}

export function QuoteCard({
  quote,
  favorited,
  onToggleFavorite,
  large,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.quote, large && styles.quoteLarge]}>
        “{quote.text}”
      </Text>
      <View style={styles.footer}>
        <Text style={styles.author}>— {quote.author}</Text>
        <Pressable
          hitSlop={12}
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={
            favorited ? 'Remove from favorites' : 'Add to favorites'
          }
        >
          <Text style={[styles.heart, favorited && styles.heartOn]}>
            {favorited ? '❤️' : '🤍'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  quote: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
  },
  quoteLarge: { fontSize: 26, lineHeight: 38 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  author: { color: colors.muted, fontSize: 15, fontStyle: 'italic', flex: 1 },
  heart: { fontSize: 26 },
  heartOn: {},
});
