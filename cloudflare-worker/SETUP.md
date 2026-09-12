# My Quotidian backend — Cloudflare Worker

Free replacement for Firebase Cloud Functions (no Blaze required). Two cron
schedules, plus a key-guarded HTTP endpoint for manual testing:

- **`5 0 * * *`** (00:05 UTC daily) → `rollDailyQuote`: fetch a fresh, non-repeating
  real quote from ZenQuotes and write it to `dailyQuote/current`.
- **`*/5 * * * *`** (every 5 min) → `sendDailyNotifications`: push the current quote
  to each user whose local notify time just arrived (once per quote, timezone-aware).

It talks to **Firestore REST** and **FCM HTTP v1** using a Firebase **service
account** (so it needs no Blaze plan and no Firebase-hosted compute).

---

## One-time setup

### 1. Get a Firebase service account key (free, no Blaze)

Firebase console → ⚙️ **Project settings → Service accounts** → **Generate new
private key** → downloads a JSON file. Save it as `serviceAccount.json` in this
folder (it's gitignored). This key can read/write Firestore and send FCM.

### 2. Create a free Cloudflare account + install deps

- Sign up at https://dash.cloudflare.com/sign-up (free).
- From this folder:
  ```bash
  npm install
  npx wrangler login     # opens a browser to authorize
  ```

### 3. Set the two secrets

```bash
# The whole service-account JSON, piped in from the file:
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT < serviceAccount.json

# A random string that guards the manual /roll and /notify endpoints:
npx wrangler secret put TRIGGER_KEY
# (paste any long random string when prompted — keep a copy)
```

### 4. Deploy

```bash
npx wrangler deploy
```

Wrangler prints your Worker URL, e.g. `https://my-quotidian-backend.<subdomain>.workers.dev`.
The cron triggers are now live.

### 5. Seed the first quote (so the app shows one immediately)

Don't wait until 00:05 UTC — trigger the roll manually:

```bash
curl "https://my-quotidian-backend.<subdomain>.workers.dev/roll?key=<TRIGGER_KEY>"
```

You should see `Rolled: <author>: <quote>`. Check Firestore → `dailyQuote/current`
is now populated, and the app's Home tab shows the quote.

To test a push immediately (make sure your notify time in the app is within the
last 30 minutes, or temporarily set it to now):

```bash
curl "https://my-quotidian-backend.<subdomain>.workers.dev/notify?key=<TRIGGER_KEY>"
```

---

## Notes & limits

- **Cost:** Cloudflare Workers free plan includes cron triggers and 100k
  requests/day — far more than this app uses.
- **Subrequests:** the free plan allows 50 subrequests per invocation. Each
  notification run uses ~2 + (2 × users being notified). Fine for personal /
  small use; for thousands of users, upgrade the Worker plan or batch sends.
- **FCM API:** if `/notify` returns a 403 mentioning the API is disabled, enable
  **Firebase Cloud Messaging API (V1)** for the project in Google Cloud console
  (it's usually already on for Firebase projects with a mobile app).
- **Logs:** `npx wrangler tail` streams live logs while debugging.
- **Tuning:** `wrangler.toml` `[vars]` — `DEDUPE_WINDOW_DAYS` (no-repeat window),
  `NOTIFY_WINDOW_MINUTES` (late-tick tolerance). Schedules are the `crons` list.
