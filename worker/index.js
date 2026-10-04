// Thin proxy in front of resultater.volleyball.dk.
// It only adds CORS, short caching and the ASP.NET search postback; all HTML parsing happens in the browser.

const BASE = 'https://resultater.volleyball.dk/tms/Turneringer-og-resultater/';
const USER_AGENT = 'volleyball-resultater (mobile viewer proxy)';
const SEARCH_URL = BASE + 'Soegning.aspx';
const P = 'ctl00$ContentPlaceHolder1$Soegning$';

// Pages whose content changes on match days get a short cache; everything else an hour.
const LIVE_PAGE = /^(Pulje-Stilling|Pulje-Kampprogram|Pulje-Komplet-Kampprogram|Hold-Kampprogram|Kamp-Information|Spillested-Kampprogram)\.aspx$/;
const PAGE_NAME = /^[A-Za-z-]+\.aspx$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': 'X-Final-Url',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
      try {
        if (url.pathname.startsWith('/api/page/')) return await page(url);
        if (url.pathname === '/api/search') return await search(url);
      } catch (err) {
        return text(`Upstream error: ${err.message}`, 502);
      }
      return text('Not found', 404);
    }
    return env.ASSETS.fetch(request);
  },
};

async function page(url) {
  const name = url.pathname.slice('/api/page/'.length);
  if (!PAGE_NAME.test(name)) return text('Bad page name', 400);
  const ttl = LIVE_PAGE.test(name) ? 60 : 3600;
  const res = await fetch(BASE + name + url.search, {
    headers: { 'User-Agent': USER_AGENT },
    cf: { cacheTtl: ttl, cacheEverything: true },
  });
  if (!res.ok) return text(`Upstream returned ${res.status}`, 502);
  // Several pages redirect (e.g. a league with a single group goes straight to its standings),
  // so tell the client where it ended up.
  const final = new URL(res.url);
  return new Response(await res.text(), {
    headers: {
      ...CORS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': `public, max-age=${ttl}`,
      'X-Final-Url': final.pathname.split('/').pop() + final.search,
    },
  });
}

// The search page is an ASP.NET WebForms postback: fetch the form for its hidden state fields, then POST.
const SEARCHES = {
  rows: (q) => ({
    Search: 'rbRows',
    ddlDistrict_Rows: num(q.get('district')),
    ddlGender: num(q.get('gender')),
    ddlDivision: num(q.get('division')),
    ddlSeason: num(q.get('season')),
    btnSearchRows: 'Søg',
  }),
  club: (q) => ({ Search: 'rbClub', txtClubName: q.get('q') ?? '', btnSearchClub: 'Søg' }),
  match: (q) => ({ Search: 'rbMatch', txtMatchNumber: num(q.get('q')), btnSearchMatchNumber: 'Søg' }),
};

async function search(url) {
  const build = SEARCHES[url.searchParams.get('type')];
  if (!build) return text('Unknown search type', 400);
  const fields = build(url.searchParams);
  if (Object.values(fields).some((v) => v === null || v.length > 100)) return text('Bad search parameters', 400);

  // Reuse a cached copy of the form; if its state has gone stale the server answers 500, so retry once with a fresh one.
  let res = await postSearch(fields, 3600);
  if (res.status === 500) res = await postSearch(fields, 0);
  if (!res.ok) return text(`Upstream returned ${res.status}`, 502);
  return new Response(await res.text(), {
    headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}

async function postSearch(fields, formTtl) {
  const form = await fetch(SEARCH_URL, {
    headers: { 'User-Agent': USER_AGENT },
    cf: formTtl ? { cacheTtl: formTtl, cacheEverything: true } : { cacheTtl: 0 },
  });
  const html = await form.text();
  const body = new URLSearchParams();
  for (const [, name, value] of html.matchAll(/<input type="hidden" name="([^"]+)" id="[^"]*" value="([^"]*)"/g)) {
    body.set(name, value.replaceAll('&amp;', '&'));
  }
  for (const [key, value] of Object.entries(fields)) body.set(P + key, value);
  return fetch(SEARCH_URL, {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

function num(value) {
  return /^\d{1,6}$/.test(value ?? '') ? value : null;
}

function text(message, status) {
  return new Response(message, { status, headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' } });
}
