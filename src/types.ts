export interface Quote {
  /** Stable hash of normalized (author + text). Used as the de-dupe key and favorite doc id. */
  id: string;
  text: string;
  author: string;
}

export interface DailyQuote extends Quote {
  /** ISO date string (YYYY-MM-DD) this quote was chosen for. */
  date: string;
}

export interface Favorite extends Quote {
  /** Firestore server timestamp (millis) when the quote was hearted. */
  heartedAt: number;
}

export interface UserPrefs {
  /** Preferred notification time as "HH:mm" in 24h local time. */
  notifyTime: string;
  /** IANA timezone, e.g. "America/New_York". */
  timezone: string;
  /** Whether daily notifications are enabled. */
  notificationsEnabled: boolean;
  /** Latest device FCM registration token. */
  fcmToken?: string;
}
