import { pdfText, parseScoresheet } from './scoresheet.js';

// Fetches pages through the Worker proxy and parses them into Documents.
// Set VITE_API_BASE (e.g. https://volleyball-resultater.<you>.workers.dev) when the site is hosted elsewhere, like GitHub Pages.
const API_BASE = import.meta.env.VITE_API_BASE ?? '';

// Short in-memory cache so tab switches and back-navigation don't refetch.
const cache = new Map();
const TTL = 60_000;

function get(url, read) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.time < TTL) return hit.promise;
  const promise = fetch(API_BASE + url).then((res) => {
    if (!res.ok) throw new Error(`Kunne ikke hente data fra volleyball.dk (${res.status})`);
    return read(res);
  });
  cache.set(url, { time: Date.now(), promise });
  promise.catch(() => cache.delete(url));
  return promise;
}

const html = async (res) => ({
  doc: new DOMParser().parseFromString(await res.text(), 'text/html'),
  finalUrl: res.headers.get('X-Final-Url') ?? '',
});

/** A page under /tms/Turneringer-og-resultater/, e.g. page('Pulje-Stilling.aspx?PuljeId=4141'). */
export const page = (path) => get('/api/page/' + path, html);

/** A search postback: {type: 'rows', district, gender, division, season} | {type: 'club' | 'match', q}. */
export const search = (params) => get('/api/search?' + new URLSearchParams(params), html);

/** A match's scoresheet PDF, parsed (see scoresheet.js). `done`: the match is over, so the Worker may cache it longer. */
export const scoresheet = (matchId, done) =>
  get(`/api/scoresheet?matchID=${matchId}${done ? '&done=1' : ''}`, async (res) => parseScoresheet(await pdfText(await res.arrayBuffer())));
