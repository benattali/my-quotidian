/**
 * Client-side configuration.
 *
 * The Google *Web* client ID is required for Firebase Google sign-in on both
 * iOS and Android (it is NOT the iOS or Android client ID). You get it from the
 * Firebase console → Authentication → Google provider, or from google-services.json
 * (the client with client_type 3), or the Google Cloud OAuth credentials page.
 *
 * Facebook is configured natively via app.json (appID + clientToken).
 */
export const GOOGLE_WEB_CLIENT_ID =
  '498098341478-vktcjf7uhaofndd3d54hrnch5psdt6ha.apps.googleusercontent.com';

/**
 * Facebook login is dormant until this is true. Keep it false for a Google-only
 * build: the Facebook SDK is never initialized and the button is hidden. To turn
 * it on, follow "Enabling Facebook" in the README (create the FB app, restore the
 * config plugin + autolinking, fill the app.json values), then set this to true.
 */
export const FACEBOOK_ENABLED: boolean = false;

/** Android notification channel id used for the daily quote. */
export const NOTIFICATION_CHANNEL_ID = 'quotidian-daily';

/** Default notify time for brand-new users (24h local, "HH:mm"). */
export const DEFAULT_NOTIFY_TIME = '09:00';
