// Mints a Google OAuth2 access token from a service-account key, using the
// Web Crypto API (available in Workers). Cached in-memory per isolate.

const enc = new TextEncoder();

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

let cached: { token: string; expEpoch: number } | null = null;

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlFromString(str: string): string {
  return base64url(enc.encode(str));
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const nowEpoch = Math.floor(Date.now() / 1000);
  if (cached && cached.expEpoch > nowEpoch + 60) return cached.token;

  const sa = JSON.parse(serviceAccountJson) as ServiceAccount;
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: nowEpoch + 3600,
    iat: nowEpoch,
  };

  const signingInput =
    base64urlFromString(JSON.stringify(header)) +
    '.' +
    base64urlFromString(JSON.stringify(claim));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    enc.encode(signingInput),
  );
  const assertion = signingInput + '.' + base64url(new Uint8Array(sig));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  cached = { token: data.access_token, expEpoch: nowEpoch + (data.expires_in ?? 3600) };
  return cached.token;
}
