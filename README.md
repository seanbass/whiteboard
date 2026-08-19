# Family Events PWA

A tiny, free, installable web app so Mom can add upcoming events and Dad can easily view them — no App Store required.

## How it works

```
[Phone: PWA on GitHub Pages]  <-- fetch -->  [Google Apps Script Web App]  <-->  [Google Sheet (the database)]
```

- **Frontend:** plain HTML/CSS/JS PWA, hosted free on GitHub Pages.
- **Backend:** Google Apps Script web app ([apps-script/Code.gs](apps-script/Code.gs)) reading/writing a Google Sheet.
- **Offline:** the app shell is cached by a service worker; the last-loaded events are cached in localStorage, so Dad can still view events without a connection.

Total cost: **$0**.

## Setup

### 1. Backend (Google Sheet + Apps Script)
Follow the step-by-step comments at the top of [apps-script/Code.gs](apps-script/Code.gs). You'll end up with a Web App URL.

### 2. Frontend
1. Paste the Web App URL into `API_URL` at the top of [app.js](app.js).
2. Add two icon images: `icons/icon-192.png` (192×192) and `icons/icon-512.png` (512×512). Any simple calendar image works — try https://favicon.io or export from any image editor.

### 3. Host on GitHub Pages
1. Push this repo to GitHub.
2. Repo Settings → Pages → Source: `main` branch, `/ (root)` folder.
3. Your app is live at `https://<username>.github.io/<repo>/`.

### 4. Install on your parents' phones
Send them the link, then:
- **iPhone (Safari):** open the link → Share button → **Add to Home Screen**.
- **Android (Chrome):** open the link → menu (⋮) → **Add to Home Screen / Install app**.

It now opens full-screen from an icon like a normal app.

## Local development

Serve the folder with any static server (service workers need http, not file://):

```bash
npx serve .
# or
python -m http.server 8000
```

## Security note

The Apps Script endpoint is deployed with "Anyone with the link" access. The URL is long and unguessable, and the data is just family event titles/dates, so this is a reasonable tradeoff for a two-person app. Don't share the URL publicly.
