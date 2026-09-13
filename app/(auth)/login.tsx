import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SignInCancelledError, signInWithGoogle } from '@/auth';
import { colors, spacing } from '@/theme';

export default function Login() {
  const [busy, setBusy] = useState(false);

  async function onGoogle() {
    if (busy) return;
    setBusy(true);
    try {
      await signInWithGoogle();
      // On success, the auth gate in _layout navigates to the tabs.
    } catch (err) {
      if (!(err instanceof SignInCancelledError)) {
        Alert.alert('Sign-in failed', (err as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>My Quotidian</Text>
        <Text style={styles.subtitle}>
          A real, hand-picked quote to lift your day — delivered when you want it.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.google]}
          disabled={busy}
          onPress={onGoogle}
        >
          {busy ? (
            <ActivityIndicator color="#1f1f1f" />
          ) : (
            <Text style={[styles.buttonText, styles.googleText]}>
              Continue with Google
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 34, fontWeight: '800' },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  actions: { gap: spacing.md, paddingBottom: spacing.lg },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  google: { backgroundColor: '#ffffff' },
  googleText: { color: '#1f1f1f' },
});
