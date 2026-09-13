import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

/**
 * Per-screen title bar. The swipeable tab pager has no navigator header, so each
 * screen renders this at the top to keep the purple "Today / Favorites / Settings"
 * heading.
 */
export function ScreenHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { color: colors.accent, fontSize: 30, fontWeight: '800' },
});
