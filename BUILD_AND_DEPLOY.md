# Build and deploy

## How it works

```
phone ──> Svelte app (static) ──> /api/* Cloudflare Worker ──> resultater.volleyball.dk
```

- **`worker/index.js`** – a small Cloudflare Worker. It proxies an allow-list of `*.aspx` pages under
  `/tms/Turneringer-og-resultater/`, adds CORS headers, caches responses briefly (60 s for schedules/standings/matches,
  1 h for everything else) and performs the ASP.NET search postback (`/api/search`). It also serves the built app.
- **`src/lib/parse.js`** – turns the site's HTML tables into plain objects (runs in the browser).
- **`src/lib/views/`** – one Svelte view per route: home, league (`raekke`), group (`pulje`), team (`hold`), match (`kamp`), club (`klub`), venue (`spillested`).

Nothing is stored or scraped on a schedule; every page view fetches live data through the Worker.
Favourite teams and the last used league filter are stored in the browser's `localStorage`.

## Development

```sh
npm install
npm run build && npm run dev:worker   # full app + API on http://localhost:8787
# or, for hot reload of the UI:
npm run dev:worker                    # terminal 1 (API on :8787)
npm run dev                           # terminal 2 (Vite on :5173, proxies /api to :8787)
```

## Deploy (Cloudflare, free tier)

```sh
npx wrangler login     # once
npm run deploy         # builds the app and deploys Worker + assets
```

The app is deployed to https://volleyball-resultater.tobias-fg.workers.dev. Pushing to GitHub does not deploy; run
`npm run deploy` after changes.

### Hosting the app on GitHub Pages instead

The app is a static site with hash routing, so it runs on any static host. Deploy the Worker as above, then build with
the Worker's URL and publish `dist/`:

```sh
VITE_API_BASE=https://volleyball-resultater.tobias-fg.workers.dev npm run build
```

## Notes

- Upstream HTML can change without notice; if a page renders empty, check the matching parser in `src/lib/parse.js`.
- The search page needs a region ("forbund/kreds") – searching without one makes the upstream server return 500.
