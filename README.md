# Sisi mi @ 70

The RSVP site for Mrs. Oyinlola Olowu's 70th birthday. Plain HTML, CSS and JavaScript: no framework and no build step.

- `public/`: the website, and the only folder that's published.
  - `config.js`: the date, times, venues, when RSVPs close, the music, and the Google Form and Drive details. Change things here, not in the code.
  - `index.html`, `styles.css`, `app.js`, `sound.js` (the waltz, played by the browser).
  - `assets/`: the invitation and florals (cut from the client's invitation), and the link preview image.
  - `vendor/qrcode.js`: draws the QR on each guest's pass (MIT, loaded only when a pass is shown).
  - `_headers`: caching for Cloudflare Pages.
- `google/`: connecting RSVPs to the client's Google Form and video messages to her Drive. Start with `google/SETUP.md`.

## Try it locally

    cd public && python3 -m http.server 4173

Then open http://localhost:4173. Until `config.js` has the form and upload links, it runs in preview mode: everything works and nothing is sent (the browser console shows what would have been sent).

## Publish

Cloudflare Pages: connect this repository, framework preset **None**, no build command, build output directory **`public`**. Every push to `main` then redeploys.
(Netlify also works: `netlify.toml` publishes `public`.)
