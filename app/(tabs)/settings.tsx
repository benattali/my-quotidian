import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { useAuth } from '@/AuthContext';
import { signOut } from '@/auth';
import { subscribeUserPrefs, updateNotifyTime } from '@/quotes';
import { UserPrefs } from '@/types';
import { colors, spacing } from '@/theme';
import { DEFAULT_NOTIFY_TIME } from '@/config';

function timeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function dateToTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDisplay(hhmm: string): string {
  const d = timeToDate(hhmm);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function Settings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserPrefs(user.uid, setPrefs);
    return unsub;
  }, [user]);

  const notifyTime = prefs?.notifyTime ?? DEFAULT_NOTIFY_TIME;

  async function onChangeTime(event: DateTimePickerEvent, date?: Date) {
    // On Android the picker is a one-shot dialog; dismiss it after any result.
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed' || !date || !user) return;
    try {
      await updateNotifyTime(user.uid, dateToTime(date));
    } catch (e) {
      Alert.alert('Could not save time', (e as Error).message);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>

        <Pressable style={styles.row} onPress={() => setShowPicker(true)}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Delivery time</Text>
            <Text style={styles.rowSubtitle}>
              When would you like to receive your inspiration?
            </Text>
          </View>
          <Text style={styles.time}>{formatDisplay(notifyTime)}</Text>
        </Pressable>

        {showPicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={timeToDate(notifyTime)}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
              themeVariant="dark"
            />
            {Platform.OS === 'ios' && (
              <Pressable
                style={styles.doneBtn}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.spacer} />

        <Pressable style={styles.signOut} onPress={() => void signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
        {user?.email ? (
          <Text style={styles.account}>Signed in as {user.email}</Text>
        ) : null}
        <Text style={styles.attribution}>Quotes by ZenQuotes.io</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.md, gap: spacing.sm },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  disabled: { opacity: 0.5 },
  rowText: { flex: 1, paddingRight: spacing.md },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  rowSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  time: { color: colors.accent, fontSize: 17, fontWeight: '700' },
  pickerWrap: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  doneBtn: { alignSelf: 'flex-end', padding: spacing.sm },
  doneText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  spacer: { flex: 1 },
  signOut: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  account: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  attribution: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
    opacity: 0.6,
  },
});
