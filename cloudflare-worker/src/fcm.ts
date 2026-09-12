// FCM HTTP v1 send.

export interface FcmResult {
  ok: boolean;
  unregistered: boolean;
}

export async function sendPush(
  projectId: string,
  token: string,
  deviceToken: string,
  quote: { id: string; text: string; author: string },
): Promise<FcmResult> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: {
            title: 'Your daily quote ✨',
            body: `"${quote.text}" — ${quote.author}`,
          },
          data: { quoteId: quote.id, text: quote.text, author: quote.author },
          android: {
            priority: 'high',
            notification: { channel_id: 'quotidian-daily' },
          },
          apns: { payload: { aps: { sound: 'default' } } },
        },
      }),
    },
  );

  if (res.ok) return { ok: true, unregistered: false };

  const bodyText = await res.text();
  // A dead token comes back as 404 UNREGISTERED / NOT_FOUND.
  const unregistered =
    res.status === 404 ||
    /UNREGISTERED|registration-token-not-registered|invalid.?registration/i.test(bodyText);
  if (!unregistered) {
    console.log(`FCM send failed ${res.status}: ${bodyText}`);
  }
  return { ok: false, unregistered };
}
