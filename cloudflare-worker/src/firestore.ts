// Minimal Firestore REST client (get / patch / delete-field / runQuery) with
// typed-value encoding, scoped to the (default) database.

export interface FsDoc {
  name: string;
  fields: Record<string, unknown>;
}

type FsValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { nullValue: null };

function root(projectId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

function encodeValue(v: unknown): FsValue {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  return { nullValue: null };
}

function encodeFields(obj: Record<string, unknown>): Record<string, FsValue> {
  const out: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = encodeValue(v);
  return out;
}

export function decodeFields(fields: Record<string, any> | undefined): Record<string, any> {
  const out: Record<string, any> = {};
  if (!fields) return out;
  for (const [k, v] of Object.entries(fields)) {
    if ('stringValue' in v) out[k] = v.stringValue;
    else if ('booleanValue' in v) out[k] = v.booleanValue;
    else if ('integerValue' in v) out[k] = Number(v.integerValue);
    else if ('doubleValue' in v) out[k] = v.doubleValue;
    else if ('timestampValue' in v) out[k] = v.timestampValue;
    else if ('nullValue' in v) out[k] = null;
  }
  return out;
}

function authHeaders(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}

/** Reads one document; returns null if it does not exist. */
export async function fsGet(
  projectId: string,
  token: string,
  path: string,
): Promise<FsDoc | null> {
  const res = await fetch(`${root(projectId)}/${path}`, { headers: authHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fsGet ${path} ${res.status}: ${await res.text()}`);
  return (await res.json()) as FsDoc;
}

/**
 * Merge-writes `fields` into a document. If `updateMask` is given, only those
 * field paths are touched (fields absent from the body but named in the mask are
 * DELETED — that's how we clear a dead fcmToken).
 */
export async function fsPatch(
  projectId: string,
  token: string,
  path: string,
  fields: Record<string, unknown>,
  updateMask?: string[],
): Promise<void> {
  let url = `${root(projectId)}/${path}`;
  if (updateMask && updateMask.length) {
    url +=
      '?' +
      updateMask
        .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
        .join('&');
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ fields: encodeFields(fields) }),
  });
  if (!res.ok) throw new Error(`fsPatch ${path} ${res.status}: ${await res.text()}`);
}

/** Runs a structured query at the database root; returns the matched documents. */
export async function fsRunQuery(
  projectId: string,
  token: string,
  structuredQuery: unknown,
): Promise<FsDoc[]> {
  const res = await fetch(`${root(projectId)}:runQuery`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ structuredQuery }),
  });
  if (!res.ok) throw new Error(`fsRunQuery ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as Array<{ document?: FsDoc }>;
  return rows.filter((r) => r.document).map((r) => r.document as FsDoc);
}
