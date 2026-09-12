import * as crypto from 'crypto';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

import { DEDUPE_WINDOW_DAYS, MAX_DEDUPE_RETRIES } from './config';

export interface RawQuote {
  text: string;
  author: string;
}

export interface StoredQuote extends RawQuote {
  id: string;
}

/** Normalizes text for stable hashing so the same quote from any source dedupes. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/["“”'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function quoteId(q: RawQuote): string {
  const key = `${normalize(q.author)}|${normalize(q.text)}`;
  return crypto.createHash('sha1').update(key).digest('hex');
}

/**
 * Fetches a single real, human-authored quote from ZenQuotes.
 * ZenQuotes serves a curated database of genuine quotations (no AI generation).
 */
async function fetchRandomQuote(): Promise<RawQuote> {
  const res = await fetch('https://zenquotes.io/api/random');
  if (!res.ok) {
    throw new Error(`ZenQuotes responded ${res.status}`);
  }
  const data = (await res.json()) as Array<{ q: string; a: string }>;
  const item = data?.[0];
  if (!item?.q || !item?.a) {
    throw new Error('Unexpected ZenQuotes payload');
  }
  // Guard against the rate-limit placeholder ZenQuotes returns as a "quote".
  if (/obtain an api key|too many requests/i.test(item.a + item.q)) {
    throw new Error('ZenQuotes rate limited');
  }
  return { text: item.q.trim(), author: item.a.trim() };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Picks a quote that has NOT been used within the dedupe window. Re-rolls the
 * API on collisions; if every attempt collides (extremely unlikely), returns the
 * least-recently-used candidate seen during the attempts.
 */
export async function pickFreshQuote(
  db: admin.firestore.Firestore,
): Promise<StoredQuote> {
  const cutoffMs = Date.now() - DEDUPE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  let fallback: { quote: StoredQuote; lastSentAt: number } | null = null;

  for (let attempt = 0; attempt < MAX_DEDUPE_RETRIES; attempt++) {
    let raw: RawQuote;
    try {
      raw = await fetchRandomQuote();
    } catch (err) {
      logger.warn('Quote fetch failed, retrying', err);
      await sleep(1500); // back off (ZenQuotes free tier is rate limited)
      continue;
    }

    const id = quoteId(raw);
    const historyRef = db.collection('quoteHistory').doc(id);
    const snap = await historyRef.get();
    const lastSentAt = (snap.data()?.lastSentAt as number | undefined) ?? 0;

    if (!snap.exists || lastSentAt < cutoffMs) {
      return { ...raw, id };
    }

    // Seen recently — remember the oldest as a last resort, then re-roll.
    if (!fallback || lastSentAt < fallback.lastSentAt) {
      fallback = { quote: { ...raw, id }, lastSentAt };
    }
    await sleep(1200);
  }

  if (fallback) {
    logger.warn('Dedupe window exhausted; using least-recently-used quote.');
    return fallback.quote;
  }
  throw new Error('Could not fetch any quote after retries.');
}

/** Records that a quote was used, for future dedupe checks. */
export async function recordQuoteUsed(
  db: admin.firestore.Firestore,
  quote: StoredQuote,
): Promise<void> {
  await db.collection('quoteHistory').doc(quote.id).set({
    text: quote.text,
    author: quote.author,
    lastSentAt: Date.now(),
  });
}
