// Account & data deletion page, served at /data-deletion (Google Play requires a
// dedicated URL that prominently describes how users delete their account/data).

const CONTACT_EMAIL = 'ben.attali8@gmail.com';

export const DELETION_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>My Quotidian — Delete Your Account & Data</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #f6f7f9; color: #1a1d24; font: 16px/1.6 -apple-system, system-ui, Segoe UI, Roboto, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 40px 20px 80px; }
  h1 { color: #6C27B3; font-size: 30px; margin: 0 0 16px; }
  h2 { color: #6C27B3; font-size: 20px; margin: 32px 0 8px; }
  a { color: #6C27B3; }
  ol, ul { padding-left: 22px; }
  li { margin: 6px 0; }
  .app { font-weight: 700; }
</style>
</head>
<body>
<main>
  <h1>Delete your My Quotidian account & data</h1>

  <p>This page explains how to delete your <span class="app">My Quotidian</span>
  account and the data associated with it.</p>

  <h2>How to request deletion</h2>
  <ol>
    <li>Email <a href="mailto:${CONTACT_EMAIL}?subject=Delete%20my%20My%20Quotidian%20account">${CONTACT_EMAIL}</a>
      from the email address you use to sign in to My Quotidian.</li>
    <li>Put "Delete my account" in the subject line.</li>
    <li>We will verify the request and delete your account and associated data.</li>
  </ol>

  <h2>What is deleted</h2>
  <p>When you request deletion, we permanently delete all data tied to your account:</p>
  <ul>
    <li>Your account and profile (name and email from Google sign-in)</li>
    <li>Your saved (favorited) quotes</li>
    <li>Your notification preferences and delivery time</li>
    <li>Your device push-notification token</li>
  </ul>

  <h2>What is kept, and for how long</h2>
  <p>We do not keep any personal data after deletion. Your data is removed within
  <strong>30 days</strong> of a verified request, and nothing is retained beyond
  that period. (The daily quotes themselves are public quotations and are not
  personal data.)</p>

  <h2>Contact</h2>
  <p>Questions about deletion? Email
  <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
</main>
</body>
</html>`;
