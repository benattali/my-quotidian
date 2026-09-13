/**
 * Client-side configuration.
 *
 * The Google *Web* client ID is required for Firebase Google sign-in on both
 * iOS and Android (it is NOT the iOS or Android client ID). You get it from the
 * Firebase console → Authentication → Google provider, or from google-services.json
 * (the client with client_type 3), or the Google Cloud OAuth credentials page.
 */
export const GOOGLE_WEB_CLIENT_ID =
  '498098341478-vktcjf7uhaofndd3d54hrnch5psdt6ha.apps.googleusercontent.com';

/** Android notification channel id used for the daily quote. */
export const NOTIFICATION_CHANNEL_ID = 'quotidian-daily';

/** Default notify time for brand-new users (24h local, "HH:mm"). */
export const DEFAULT_NOTIFY_TIME = '09:00';
