import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Quote } from '@/types';
import { colors, spacing } from '@/theme';

const HEART_FILLED = require('../../assets/icons/heart.png');
const HEART_OUTLINE = require('../../assets/icons/heart-outline.png');
const QUOTE_MARK = require('../../assets/icons/quote.png');

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
      {/* Bubbly quotation-mark ornaments straddling the corners, rendered
          behind the text so their inner half never covers a word. */}
      <View style={[styles.markBox, styles.markBoxOpen]}>
        <Image source={QUOTE_MARK} resizeMode="contain" style={styles.markImg} />
      </View>
      <View style={[styles.markBox, styles.markBoxClose]}>
        <Image
          source={QUOTE_MARK}
          resizeMode="contain"
          style={[styles.markImg, styles.markImgFlip]}
        />
      </View>

      <Text style={[styles.quote, large && styles.quoteLarge]}>
        {quote.text}
      </Text>
      {quote.author?.trim() ? (
        <Text style={styles.author}>— {quote.author}</Text>
      ) : null}

      <Pressable
        style={styles.heartBtn}
        hitSlop={12}
        onPress={onToggleFavorite}
        accessibilityRole="button"
        accessibilityLabel={
          favorited ? 'Remove from favorites' : 'Add to favorites'
        }
      >
        <Image
          source={favorited ? HEART_FILLED : HEART_OUTLINE}
          resizeMode="contain"
          style={styles.heart}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  quote: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
  },
  quoteLarge: { fontSize: 26, lineHeight: 38 },
  author: {
    color: colors.muted,
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  heartBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, padding: 4 },
  heart: { width: 28, height: 28 },

  // A fixed-size anchor box keeps the ornament straddling the corner regardless
  // of the glyph's own font metrics.
  // Box is larger than the (rotated) glyph so Android never clips it.
  markBox: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  markBoxOpen: {
    top: -34,
    left: -54,
    transform: [{ rotate: '12deg' }],
  },
  markBoxClose: {
    bottom: -38,
    right: -54,
    transform: [{ rotate: '-12deg' }],
  },
  markImg: {
    width: 84,
    height: 84,
    tintColor: colors.accent,
  },
  markImgFlip: {
    transform: [{ rotate: '180deg' }],
  },
});
