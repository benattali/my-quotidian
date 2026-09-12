// Quote fetching + de-duplication (mirrors the original Firebase function logic).

import { fsGet, fsPatch } from './firestore';

const enc = new TextEncoder();
const MAX_DEDUPE_RETRIES = 12;

export interface StoredQuote {
  id: string;
  text: string;
  author: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/["“”'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', enc.encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function quoteId(author: string, text: string): Promise<string> {
  return sha1Hex(`${normalize(author)}|${normalize(text)}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchRandomQuote(): Promise<{ text: string; author: string }> {
  const res = await fetch('https://zenquotes.io/api/random');
  if (!res.ok) throw new Error(`ZenQuotes ${res.status}`);
  const data = (await res.json()) as Array<{ q: string; a: string }>;
  const item = data?.[0];
  if (!item?.q || !item?.a) throw new Error('Unexpected ZenQuotes payload');
  if (/obtain an api key|too many requests/i.test(item.a + item.q)) {
    throw new Error('ZenQuotes rate limited');
  }
  return { text: item.q.trim(), author: item.a.trim() };
}

/** Picks a quote not used within `windowDays`; falls back to least-recently-used. */
export async function pickFreshQuote(
  projectId: string,
  token: string,
  windowDays: number,
): Promise<StoredQuote> {
  const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  let fallback: { quote: StoredQuote; lastSentAt: number } | null = null;

  for (let attempt = 0; attempt < MAX_DEDUPE_RETRIES; attempt++) {
    let raw: { text: string; author: string };
    try {
      raw = await fetchRandomQuote();
    } catch {
      await sleep(1500);
      continue;
    }

    const id = await quoteId(raw.author, raw.text);
    const hist = await fsGet(projectId, token, `quoteHistory/${id}`);
    const lastSentAt = hist
      ? Number((hist.fields?.lastSentAt as any)?.integerValue ?? 0)
      : 0;

    if (!hist || lastSentAt < cutoffMs) {
      return { id, ...raw };
    }
    if (!fallback || lastSentAt < fallback.lastSentAt) {
      fallback = { quote: { id, ...raw }, lastSentAt };
    }
    await sleep(1200);
  }

  if (fallback) return fallback.quote;
  throw new Error('Could not fetch any quote after retries.');
}

export async function recordQuoteUsed(
  projectId: string,
  token: string,
  quote: StoredQuote,
): Promise<void> {
  await fsPatch(projectId, token, `quoteHistory/${quote.id}`, {
    text: quote.text,
    author: quote.author,
    lastSentAt: Date.now(),
  });
}
