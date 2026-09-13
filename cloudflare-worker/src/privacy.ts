// Privacy policy page, served at /privacy (satisfies Google Play's requirement).
// Edit the CONTACT_EMAIL and effective date as needed.

const CONTACT_EMAIL = 'ben.attali8@gmail.com';
const EFFECTIVE_DATE = 'September 13, 2026';

export const PRIVACY_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>My Quotidian — Privacy Policy</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #f6f7f9; color: #1a1d24; font: 16px/1.6 -apple-system, system-ui, Segoe UI, Roboto, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 40px 20px 80px; }
  h1 { color: #6C27B3; font-size: 30px; margin: 0 0 4px; }
  h2 { color: #6C27B3; font-size: 20px; margin: 32px 0 8px; }
  .date { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  a { color: #6C27B3; }
  ul { padding-left: 20px; }
  li { margin: 4px 0; }
</style>
</head>
<body>
<main>
  <h1>My Quotidian — Privacy Policy</h1>
  <div class="date">Effective ${EFFECTIVE_DATE}</div>

  <p>My Quotidian ("the app") sends you one real, hand-picked quote each day and lets
  you save your favorites. This policy explains what data the app handles and why.</p>

  <h2>Information we collect</h2>
  <ul>
    <li><strong>Account information.</strong> When you sign in with Google, we receive your
      name, email address, and Google account identifier, used solely to create and identify your account.</li>
    <li><strong>App data.</strong> The quotes you save ("favorites"), your chosen notification
      delivery time, your device's time zone, and a push-notification token — used to deliver
      your daily quote and sync your favorites across your devices.</li>
  </ul>

  <h2>How we use your information</h2>
  <ul>
    <li>To authenticate you and keep you signed in.</li>
    <li>To send your daily quote notification at the time you choose.</li>
    <li>To store and display the quotes you have favorited.</li>
  </ul>
  <p>We do <strong>not</strong> sell your personal data, and we do not share it with third
  parties for advertising.</p>

  <h2>Service providers</h2>
  <ul>
    <li><strong>Google Firebase</strong> — authentication and the Cloud Firestore database that
      stores your account, favorites, and preferences.</li>
    <li><strong>Cloudflare Workers</strong> — the backend service that selects the daily quote and
      sends notifications.</li>
    <li><strong>ZenQuotes.io</strong> — the source of the quotations. No personal data is sent to them.</li>
  </ul>

  <h2>Data retention and deletion</h2>
  <p>We keep your data while your account is active. To delete your account and all associated
  data (favorites and preferences), email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
  from your account email, and we will delete it.</p>

  <h2>Children</h2>
  <p>The app is not directed to children under 13, and we do not knowingly collect their data.</p>

  <h2>Changes</h2>
  <p>We may update this policy; material changes will be reflected by a new effective date above.</p>

  <h2>Contact</h2>
  <p>Questions? Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
</main>
</body>
</html>`;
