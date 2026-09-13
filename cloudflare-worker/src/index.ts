import { getAccessToken } from './google';
import { decodeFields, fsGet, fsPatch, fsRunQuery } from './firestore';
import { pickFreshQuote, recordQuoteUsed } from './quotes';
import { sendPush } from './fcm';
import { PRIVACY_HTML } from './privacy';

interface Env {
  PROJECT_ID: string;
  DEDUPE_WINDOW_DAYS: string;
  NOTIFY_WINDOW_MINUTES: string;
  FIREBASE_SERVICE_ACCOUNT: string; // secret: the service-account JSON
  TRIGGER_KEY: string; // secret: guards the manual HTTP endpoints
}

// ---------------------------------------------------------------------------
// Roll the global "quote of the day" (mirrors rollDailyQuote).
// ---------------------------------------------------------------------------
async function rollDailyQuote(env: Env, token: string): Promise<string> {
  const quote = await pickFreshQuote(
    env.PROJECT_ID,
    token,
    Number(env.DEDUPE_WINDOW_DAYS || '180'),
  );
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  await fsPatch(env.PROJECT_ID, token, 'dailyQuote/current', {
    id: quote.id,
    text: quote.text,
    author: quote.author,
    date,
  });
  await recordQuoteUsed(env.PROJECT_ID, token, quote);
  return `${quote.author}: ${quote.text}`;
}

// ---------------------------------------------------------------------------
// Deliver the current quote to users at their local notify time.
// ---------------------------------------------------------------------------
async function sendDailyNotifications(env: Env, token: string): Promise<number> {
  const dailyDoc = await fsGet(env.PROJECT_ID, token, 'dailyQuote/current');
  if (!dailyDoc) return 0;
  const quote = decodeFields(dailyDoc.fields) as {
    id: string;
    text: string;
    author: string;
  };

  const users = await fsRunQuery(env.PROJECT_ID, token, {
    from: [{ collectionId: 'users' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'notificationsEnabled' },
        op: 'EQUAL',
        value: { booleanValue: true },
      },
    },
  });

  const windowMin = Number(env.NOTIFY_WINDOW_MINUTES || '30');
  let sent = 0;

  for (const doc of users) {
    const uid = doc.name.split('/').pop() as string;
    const u = decodeFields(doc.fields) as {
      fcmToken?: string;
      notifyTime?: string;
      timezone?: string;
      lastNotifiedQuoteId?: string;
    };

    if (!u.fcmToken || !u.notifyTime) continue;
    if (u.lastNotifiedQuoteId === quote.id) continue;
    if (!isWithinNotifyWindow(u.notifyTime, u.timezone || 'UTC', windowMin)) continue;

    const result = await sendPush(env.PROJECT_ID, token, u.fcmToken, quote);
    if (result.ok) {
      await fsPatch(
        env.PROJECT_ID,
        token,
        `users/${uid}`,
        { lastNotifiedQuoteId: quote.id },
        ['lastNotifiedQuoteId'],
      );
      sent++;
    } else if (result.unregistered) {
      // Clear the dead token (delete the field via update mask).
      await fsPatch(env.PROJECT_ID, token, `users/${uid}`, {}, ['fcmToken']);
    }
  }
  return sent;
}

function isWithinNotifyWindow(
  notifyTime: string,
  timezone: string,
  windowMin: number,
): boolean {
  const nowMin = localMinutesNow(timezone);
  const [h, m] = notifyTime.split(':').map((n) => parseInt(n, 10));
  const targetMin = (h || 0) * 60 + (m || 0);
  const delta = nowMin - targetMin;
  return delta >= 0 && delta < windowMin;
}

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
    return (h % 24) * 60 + m;
  } catch {
    const now = new Date();
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  }
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------
export default {
  // Cron triggers (schedules defined in wrangler.toml).
  async scheduled(event: ScheduledController, env: Env): Promise<void> {
    const token = await getAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
    if (event.cron === '5 0 * * *') {
      const q = await rollDailyQuote(env, token);
      console.log('Rolled daily quote:', q);
    } else {
      const n = await sendDailyNotifications(env, token);
      console.log(`Notification run complete: ${n} sent.`);
    }
  },

  // Manual trigger for testing/seeding, e.g.:
  //   curl "https://<worker>.workers.dev/roll?key=<TRIGGER_KEY>"
  //   curl "https://<worker>.workers.dev/notify?key=<TRIGGER_KEY>"
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/privacy') {
      return new Response(PRIVACY_HTML, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }
    if (url.pathname === '/roll' || url.pathname === '/notify') {
      if (url.searchParams.get('key') !== env.TRIGGER_KEY) {
        return new Response('unauthorized', { status: 401 });
      }
      const token = await getAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
      if (url.pathname === '/roll') {
        const q = await rollDailyQuote(env, token);
        return new Response(`Rolled: ${q}`);
      }
      const n = await sendDailyNotifications(env, token);
      return new Response(`Sent ${n} notification(s).`);
    }
    return new Response('my-quotidian backend is running.');
  },
};
