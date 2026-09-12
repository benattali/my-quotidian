import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

import { pickFreshQuote, recordQuoteUsed } from './quotesApi';
import { NOTIFY_WINDOW_MINUTES } from './config';

admin.initializeApp();
const db = admin.firestore();

const DAILY_QUOTE_DOC = db.collection('dailyQuote').doc('current');

interface DailyQuoteDoc {
  id: string;
  text: string;
  author: string;
  date: string;
}

// ---------------------------------------------------------------------------
// 1. Roll the global "quote of the day" once per day (00:05 UTC).
// ---------------------------------------------------------------------------
export const rollDailyQuote = onSchedule(
  { schedule: '5 0 * * *', timeZone: 'Etc/UTC', timeoutSeconds: 120 },
  async () => {
    const quote = await pickFreshQuote(db);
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

    const doc: DailyQuoteDoc = { ...quote, date };
    await DAILY_QUOTE_DOC.set(doc);
    await recordQuoteUsed(db, quote);

    logger.info('Rolled daily quote', { id: quote.id, author: quote.author });
  },
);

// ---------------------------------------------------------------------------
// 2. Deliver the current quote to each user at their local notify time.
//    Runs every 5 minutes; the per-user lastNotifiedQuoteId guard prevents
//    duplicates, and the window absorbs any missed ticks.
// ---------------------------------------------------------------------------
export const sendDailyNotifications = onSchedule(
  { schedule: 'every 5 minutes', timeoutSeconds: 300 },
  async () => {
    const quoteSnap = await DAILY_QUOTE_DOC.get();
    const quote = quoteSnap.data() as DailyQuoteDoc | undefined;
    if (!quote) {
      logger.warn('No daily quote set yet; skipping notification run.');
      return;
    }

    const usersSnap = await db
      .collection('users')
      .where('notificationsEnabled', '==', true)
      .get();

    const sends: Promise<void>[] = [];
    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data();
      const token = u.fcmToken as string | undefined;
      const notifyTime = u.notifyTime as string | undefined;
      const timezone = (u.timezone as string | undefined) ?? 'UTC';
      const lastNotifiedQuoteId = u.lastNotifiedQuoteId as string | undefined;

      if (!token || !notifyTime) continue;
      if (lastNotifiedQuoteId === quote.id) continue; // already got this one
      if (!isWithinNotifyWindow(notifyTime, timezone)) continue;

      sends.push(deliver(userDoc.id, token, quote));
    }

    await Promise.allSettled(sends);
    logger.info(`Notification run complete: ${sends.length} sent.`);
  },
);

function isWithinNotifyWindow(notifyTime: string, timezone: string): boolean {
  const nowMin = localMinutesNow(timezone);
  const [h, m] = notifyTime.split(':').map((n) => parseInt(n, 10));
  const targetMin = (h || 0) * 60 + (m || 0);
  const delta = nowMin - targetMin;
  return delta >= 0 && delta < NOTIFY_WINDOW_MINUTES;
}

/** Minutes since local midnight in the given IANA timezone. */
function localMinutesNow(timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    // Intl can emit "24" for midnight in hour12:false — normalize to 0.
    return (h % 24) * 60 + m;
  } catch {
    // Unknown timezone → treat as UTC.
    const now = new Date();
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  }
}

async function deliver(
  uid: string,
  token: string,
  quote: DailyQuoteDoc,
): Promise<void> {
  try {
    await admin.messaging().send({
      token,
      notification: {
        title: 'Your daily quote ✨',
        body: `"${quote.text}" — ${quote.author}`,
      },
      data: {
        quoteId: quote.id,
        text: quote.text,
        author: quote.author,
      },
      android: {
        priority: 'high',
        notification: { channelId: 'quotidian-daily' },
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
    });
    await db
      .collection('users')
      .doc(uid)
      .set({ lastNotifiedQuoteId: quote.id }, { merge: true });
  } catch (err: any) {
    const code = err?.errorInfo?.code ?? err?.code;
    // Token is dead (app uninstalled / token rotated) — clear it.
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      await db
        .collection('users')
        .doc(uid)
        .set({ fcmToken: admin.firestore.FieldValue.delete() }, { merge: true });
      logger.info(`Cleared dead token for ${uid}`);
    } else {
      logger.warn(`Send failed for ${uid}`, err);
    }
  }
}
