import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

import { DailyQuote, Favorite, Quote, UserPrefs } from './types';
import { DEFAULT_NOTIFY_TIME } from './config';

const db = () => firestore();

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

// ---------------------------------------------------------------------------
// User preferences
// ---------------------------------------------------------------------------

/** Creates the user doc with sane defaults on first login (idempotent). */
export async function ensureUserDoc(uid: string): Promise<void> {
  const ref = db().collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    const prefs: UserPrefs = {
      notifyTime: DEFAULT_NOTIFY_TIME,
      timezone: deviceTimezone(),
      notificationsEnabled: true,
    };
    await ref.set(prefs);
  }
}

export function subscribeUserPrefs(
  uid: string,
  cb: (prefs: UserPrefs | null) => void,
): () => void {
  return db()
    .collection('users')
    .doc(uid)
    .onSnapshot(
      (snap) => cb((snap.data() as UserPrefs | undefined) ?? null),
      (err) => {
        console.warn('subscribeUserPrefs error', err);
        cb(null);
      },
    );
}

/** Persists the notify time (and refreshes timezone in case the user moved). */
export async function updateNotifyTime(
  uid: string,
  notifyTime: string,
): Promise<void> {
  await db().collection('users').doc(uid).set(
    { notifyTime, timezone: deviceTimezone() },
    { merge: true },
  );
}

export async function setNotificationsEnabled(
  uid: string,
  enabled: boolean,
): Promise<void> {
  await db()
    .collection('users')
    .doc(uid)
    .set({ notificationsEnabled: enabled }, { merge: true });
}

// ---------------------------------------------------------------------------
// Today's quote
// ---------------------------------------------------------------------------

export function subscribeTodaysQuote(
  cb: (quote: DailyQuote | null) => void,
): () => void {
  return db()
    .collection('dailyQuote')
    .doc('current')
    .onSnapshot(
      (snap) => cb((snap.data() as DailyQuote | undefined) ?? null),
      (err) => {
        console.warn('subscribeTodaysQuote error', err);
        cb(null);
      },
    );
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

function favoritesCol(
  uid: string,
): FirebaseFirestoreTypes.CollectionReference {
  return db().collection('users').doc(uid).collection('favorites');
}

export function subscribeFavorites(
  uid: string,
  cb: (favorites: Favorite[]) => void,
): () => void {
  return favoritesCol(uid)
    .orderBy('heartedAt', 'desc')
    .onSnapshot(
      (snap) => cb(snap.docs.map((d) => d.data() as Favorite)),
      (err) => {
        console.warn('subscribeFavorites error', err);
        cb([]);
      },
    );
}

/** Adds the quote to favorites if absent, removes it if present. Returns new state. */
export async function toggleFavorite(
  uid: string,
  quote: Quote,
): Promise<boolean> {
  const ref = favoritesCol(uid).doc(quote.id);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.delete();
    return false;
  }
  const fav: Favorite = {
    id: quote.id,
    text: quote.text,
    author: quote.author,
    heartedAt: Date.now(),
  };
  await ref.set(fav);
  return true;
}
