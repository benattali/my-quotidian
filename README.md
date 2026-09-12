# My Quotidian

A cross-platform (iOS + Android) app that delivers one **real, human-authored** motivational quote per day as a push notification at a time the user chooses, shows the same quote in-app, and lets users heart quotes and browse their favorites. Sign-in is Google or Facebook.

- **App:** Expo (React Native, TypeScript) + Expo Router
- **Auth + data:** Firebase Auth (Google/Facebook) + Cloud Firestore
- **Push:** Firebase Cloud Messaging (FCM), driven by scheduled Cloud Functions
- **Quotes:** [ZenQuotes](https://zenquotes.io) — a curated database of genuine quotations (no AI-generated text)

## How it works

```
Expo app ── Google/Facebook ─▶ Firebase Auth
   │  saves notifyTime + FCM token
   ▼
Firestore  users/{uid}  ·  users/{uid}/favorites/*  ·  dailyQuote/current  ·  quoteHistory/*
   ▲                                                         │
   │ rollDailyQuote (daily 00:05 UTC)                        │ sendDailyNotifications (every 5 min)
   │  picks a fresh quote, dedupes, writes dailyQuote/current │  pushes current quote to users whose
   └──────────────────────────────────────────────────────── local notify time just arrived ─▶ 📱
```

- **No repeats:** `rollDailyQuote` rejects any quote used within `DEDUPE_WINDOW_DAYS` (default **180 days**) — see `functions/src/config.ts`. Never same-as-yesterday; recurrence only after ~6 months.
- **Timezones / time changes:** the chosen time lives in Firestore, not baked into notifications. Change it any time; the next 5-minute tick respects it. `lastNotifiedQuoteId` guarantees each user gets each daily quote exactly once.
- **Works even if the app is never reopened** — delivery is fully server-side.

## Data model (Firestore)

| Path | Written by | Contents |
|---|---|---|
| `users/{uid}` | client + backend | `notifyTime`, `timezone`, `notificationsEnabled`, `fcmToken`, `lastNotifiedQuoteId` (backend) |
| `users/{uid}/favorites/{quoteId}` | client | `id`, `text`, `author`, `heartedAt` |
| `dailyQuote/current` | backend only | `id`, `text`, `author`, `date` |
| `quoteHistory/{quoteId}` | backend only | `text`, `author`, `lastSentAt` (dedupe) |

---

# Setup checklist

You need to create the accounts/credentials below — they can't be scripted. Steps that block others are marked ⛔.

## 0. Prerequisites

```bash
# from the project root
npm install
npm install -g firebase-tools eas-cli
firebase login
```

You also need **Xcode** (for iOS) and/or **Android Studio** (for Android) since this app uses native modules (FCM, Google/Facebook SDKs) and therefore a **development build** — it does **not** run in Expo Go.

## 1. ⛔ Create the Firebase project

1. https://console.firebase.google.com → **Add project**.
2. **Upgrade to the Blaze (pay-as-you-go) plan** — required for scheduled Cloud Functions. It has a large free monthly quota; this app should stay within it.
3. Add an **Android app** with package `com.myquotidian.app` → download **`google-services.json`** → place it in the project root.
4. Add an **iOS app** with bundle id `com.myquotidian.app` → download **`GoogleService-Info.plist`** → place it in the project root.
   - (Change the package/bundle id in `app.json` if you use your own — keep all three in sync.)

> Both files are gitignored. Never commit them.

## 2. Enable Auth providers

Firebase console → **Authentication → Sign-in method**:

- **Google:** enable it. Copy the **Web client ID** shown (ends in `.apps.googleusercontent.com`) into `src/config.ts` → `GOOGLE_WEB_CLIENT_ID`. This web client id is required for Google sign-in on *both* platforms.
- **Facebook:** enable it; you'll paste the App ID + secret here after step 4.

### Android extra (Google sign-in): add your signing SHA-1

Google sign-in on Android needs your app's SHA-1 fingerprints registered in Firebase.
- Debug builds: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android` — copy the SHA-1.
- EAS builds: `eas credentials` → Android → copy the SHA-1.
- Add each SHA-1 in Firebase console → Project settings → your Android app → **Add fingerprint**, then **re-download `google-services.json`**.

### iOS extra (Google sign-in): reversed client id

Open `GoogleService-Info.plist`, copy `REVERSED_CLIENT_ID`, and paste it into `app.json` → `@react-native-google-signin/google-signin` plugin → `iosUrlScheme`.

## 3. ⛔ Facebook app — OPTIONAL, dormant by default

> **Facebook login ships turned OFF.** `FACEBOOK_ENABLED = false` in `src/config.ts`, the
> `react-native-fbsdk-next` config plugin is removed from `app.json`, and the FB SDK is
> excluded from native autolinking in `react-native.config.js`. The login screen shows
> only "Continue with Google." You can build and ship Google-only and ignore this section.

**To enable Facebook later:**

1. https://developers.facebook.com → **Create App** → add **Facebook Login**.
2. Re-add the config plugin to `app.json` `plugins` (appID, clientToken, `displayName`, `scheme` = `fb<APP_ID>`):
   ```json
   ["react-native-fbsdk-next", { "appID": "<APP_ID>", "clientToken": "<CLIENT_TOKEN>", "displayName": "My Quotidian", "scheme": "fb<APP_ID>" }]
   ```
3. In `react-native.config.js`, delete the two `null` platform overrides (or delete the file) so the SDK autolinks again.
4. Set `FACEBOOK_ENABLED = true` in `src/config.ts`.
5. In the Facebook app: add the **iOS** platform (your bundle id) and **Android** platform (package + key hashes).
6. Paste the Facebook **App ID + App Secret** into Firebase console → Authentication → Facebook, and copy the **OAuth redirect URI** Firebase shows into the Facebook app's Valid OAuth Redirect URIs.
7. Re-run `npx expo prebuild` and rebuild.

## 4. iOS setup — OPTIONAL, not configured yet (Android-only by default)

The project currently targets **Android only**. Two things were deliberately left out
so the Android build works cleanly, and must be added when you set up iOS:

- The `@react-native-google-signin/google-signin` **config plugin** was removed from
  `app.json` (its plugin rejects a placeholder `iosUrlScheme`). Re-add it with the real
  reversed iOS client id from `GoogleService-Info.plist`:
  ```json
  ["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.<...>" }]
  ```
- `GoogleService-Info.plist` must be downloaded (register an **iOS app** in Firebase) and
  placed in the project root (already referenced by `ios.googleServicesFile` in `app.json`).

**iOS push (APNs):**
1. Enroll in the **Apple Developer Program** ($99/yr).
2. Create an **APNs Auth Key** (.p8) in the Apple Developer portal (Keys → enable Apple Push Notifications service).
3. Upload it in Firebase console → Project settings → **Cloud Messaging → Apple app configuration** (key, Key ID, Team ID).

> Android/FCM needs nothing extra here — it works from `google-services.json`.

## 5. Remaining placeholders

Most credentials are already filled in. What's left, only when you need it:
- **iOS:** `app.json` `iosUrlScheme` (re-added plugin, see §4) — iOS only
- **Facebook:** `app.json` FB plugin `appID` / `clientToken` / `scheme` + `FACEBOOK_ENABLED` (see §3) — only if enabling Facebook

## 6. Deploy the backend

```bash
cd functions && npm install && cd ..
firebase deploy --only firestore:rules
firebase deploy --only functions
```

Seed the first quote immediately (otherwise the app shows "no quote yet" until 00:05 UTC):

```bash
# after deploy, trigger the scheduled job once from the console:
# Firebase console → Functions → rollDailyQuote → (Cloud Scheduler) "Run now"
# or via gcloud:
gcloud scheduler jobs run firebase-schedule-rollDailyQuote-us-central1
```

## 7. Build & run the app (development build)

```bash
# Local native build (needs Xcode / Android Studio):
npx expo prebuild
npx expo run:android      # or: npx expo run:ios

# — or — cloud build with EAS:
eas build --profile development --platform android   # / ios
```

Then start the dev server for subsequent JS reloads:

```bash
npm start
```

## Tuning

- **No-repeat window:** `functions/src/config.ts` → `DEDUPE_WINDOW_DAYS`.
- **Notification precision / catch-up window:** `NOTIFY_WINDOW_MINUTES` (default 30) + the `every 5 minutes` schedule in `functions/src/index.ts`.
- **Default time for new users:** `src/config.ts` → `DEFAULT_NOTIFY_TIME`.

## Notes & limits

- ZenQuotes free tier is rate-limited (~5 req / 30s per IP); the daily job makes only a handful of calls, and `pickFreshQuote` backs off between retries.
- The global "quote of the day" rolls on **UTC** date. Users in far-eastern timezones may receive a given quote on the calendar day after it rolls, but never miss one and never get a duplicate.
- To give each user a *unique* (not global) quote instead, change `sendDailyNotifications` to call `pickFreshQuote` per user — at higher API/cost.
