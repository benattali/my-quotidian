# My Quotidian

A cross-platform (iOS + Android) app that delivers one **real, human-authored** motivational quote per day as a push notification at a time the user chooses, shows the same quote in-app, and lets users heart quotes and browse their favorites. Sign-in is Google.

- **App:** Expo (React Native, TypeScript) + Expo Router
- **Auth + data:** Firebase Auth (Google) + Cloud Firestore
- **Push:** Firebase Cloud Messaging (FCM), driven by a scheduled Cloudflare Worker (`cloudflare-worker/`)
- **Quotes:** [ZenQuotes](https://zenquotes.io) — a curated database of genuine quotations (no AI-generated text)

## How it works

```
Expo app ──── Google ────▶ Firebase Auth
   │  saves notifyTime + FCM token
   ▼
Firestore  users/{uid}  ·  users/{uid}/favorites/*  ·  dailyQuote/current  ·  quoteHistory/*
   ▲                                                         │
   │ rollDailyQuote (daily 00:05 UTC)                        │ sendDailyNotifications (every 5 min)
   │  picks a fresh quote, dedupes, writes dailyQuote/current │  pushes current quote to users whose
   └──────────────────────────────────────────────────────── local notify time just arrived ─▶ 📱
```

- **No repeats:** `rollDailyQuote` rejects any quote used within `DEDUPE_WINDOW_DAYS` (default **180 days**) — see `cloudflare-worker/wrangler.toml`. Never same-as-yesterday; recurrence only after ~6 months.
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

You also need **Xcode** (for iOS) and/or **Android Studio** (for Android) since this app uses native modules (FCM, Google Sign-In) and therefore a **development build** — it does **not** run in Expo Go.

## 1. ⛔ Create the Firebase project

1. https://console.firebase.google.com → **Add project**.
2. The free **Spark plan is enough** — the backend runs on a Cloudflare Worker (see `cloudflare-worker/SETUP.md`), so no Blaze/billing is required.
3. Add an **Android app** with package `com.myquotidian.app` → download **`google-services.json`** → place it in the project root.
4. Add an **iOS app** with bundle id `com.myquotidian.app` → download **`GoogleService-Info.plist`** → place it in the project root.
   - (Change the package/bundle id in `app.json` if you use your own — keep all three in sync.)

> Both files are gitignored. Never commit them.

## 2. Enable Auth providers

Firebase console → **Authentication → Sign-in method**:

- **Google:** enable it. Copy the **Web client ID** shown (ends in `.apps.googleusercontent.com`) into `src/config.ts` → `GOOGLE_WEB_CLIENT_ID`. This web client id is required for Google sign-in on *both* platforms.

### Android extra (Google sign-in): add your signing SHA-1

Google sign-in on Android needs your app's SHA-1 fingerprints registered in Firebase.
- Debug builds: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android` — copy the SHA-1.
- EAS builds: `eas credentials` → Android → copy the SHA-1.
- Add each SHA-1 in Firebase console → Project settings → your Android app → **Add fingerprint**, then **re-download `google-services.json`**.

### iOS extra (Google sign-in): reversed client id

Open `GoogleService-Info.plist`, copy `REVERSED_CLIENT_ID`, and paste it into `app.json` → `@react-native-google-signin/google-signin` plugin → `iosUrlScheme`.

## 3. iOS setup — OPTIONAL, not configured yet (Android-only by default)

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

## 4. Remaining placeholders

Most credentials are already filled in. What's left, only when you need it:
- **iOS:** `app.json` `iosUrlScheme` (re-added plugin, see §3) — iOS only

## 5. Deploy the backend

**Firestore security rules** (Firebase CLI):
```bash
firebase deploy --only firestore:rules
```

**The quote/notification backend** runs on a free **Cloudflare Worker** — full
steps in [`cloudflare-worker/SETUP.md`](cloudflare-worker/SETUP.md). In short:
generate a Firebase service-account key, `wrangler login`, set the
`FIREBASE_SERVICE_ACCOUNT` + `TRIGGER_KEY` secrets, `wrangler deploy`, then seed
the first quote:
```bash
curl "https://my-quotidian-backend.<subdomain>.workers.dev/roll?key=<TRIGGER_KEY>"
```

## 6. Build & run the app (development build)

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

- **No-repeat window:** `cloudflare-worker/wrangler.toml` → `DEDUPE_WINDOW_DAYS`.
- **Notification precision / catch-up window:** `NOTIFY_WINDOW_MINUTES` + the `*/5 * * * *` schedule in `cloudflare-worker/wrangler.toml`.
- **Default time for new users:** `src/config.ts` → `DEFAULT_NOTIFY_TIME`.

## Notes & limits

- ZenQuotes free tier is rate-limited (~5 req / 30s per IP); the daily job makes only a handful of calls, and `pickFreshQuote` backs off between retries.
- The global "quote of the day" rolls on **UTC** date. Users in far-eastern timezones may receive a given quote on the calendar day after it rolls, but never miss one and never get a duplicate.
- To give each user a *unique* (not global) quote instead, change `sendDailyNotifications` to call `pickFreshQuote` per user — at higher API/cost.
