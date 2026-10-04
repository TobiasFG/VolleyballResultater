// Parsers for the HTML pages of resultater.volleyball.dk.
// Every function takes a parsed Document and returns plain data.

export const clean = (s) => (s ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

/** Text of an element split on <br>, e.g. "Kildeskovshal 1<br/>1" -> ["Kildeskovshal 1", "1"]. */
function lines(el) {
  if (!el) return [];
  const out = [''];
  for (const node of el.childNodes) {
    if (node.nodeName === 'BR') out.push('');
    else out[out.length - 1] += node.textContent;
  }
  return out.map(clean).filter(Boolean);
}

function param(a, key) {
  return a?.getAttribute('href')?.match(new RegExp(key + '=(\\d+)', 'i'))?.[1] ?? null;
}

/** First link inside `el` carrying `key` (e.g. HoldId) as {id, name}; falls back to plain text. */
function link(el, key) {
  if (!el) return null;
  const a = [...el.querySelectorAll('a')].find((a) => param(a, key));
  if (a) return { id: param(a, key), name: clean(a.textContent) };
  const name = clean(el.textContent);
  return name ? { id: null, name } : null;
}

function links(el, key) {
  return [...(el?.querySelectorAll('a') ?? [])]
    .filter((a) => param(a, key))
    .map((a) => ({ id: param(a, key), name: clean(a.textContent) }));
}

/** "17-10-26 kl. 16:45" or "10-10-2025 kl. 20:00" -> Date */
export function parseDate(text) {
  const m = text.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})(?:\D+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
  return new Date(year, m[2] - 1, +m[1], +(m[4] ?? 0), +(m[5] ?? 0));
}

function parseScore(text) {
  const m = clean(text).match(/^(\d+)\s*-\s*(\d+)$/);
  return m ? [+m[1], +m[2]] : null;
}

/** Label/value tables such as srMatchInformation and srTeamInformation -> Map(label -> value cell). */
function keyValues(table) {
  const map = new Map();
  for (const tr of table?.querySelectorAll('tr') ?? []) {
    const label = tr.querySelector('td.c01');
    const value = tr.querySelector('td.c02');
    if (label && value) map.set(clean(label.textContent), value);
  }
  return map;
}

const known = (s) => (s && s !== 'Ikke angivet' ? s : '');

/** Only plain web links from upstream may become hrefs (blocks e.g. javascript: URLs entered by club admins). */
const webUrl = (a) => {
  const href = a?.getAttribute('href')?.trim();
  return href && /^https?:\/\//i.test(href) ? href : null;
};
const headline = (doc) => clean(doc.querySelector('h2.sr')?.textContent);
const comment = (doc) => clean(doc.querySelector('.srPageComment')?.textContent).replace(/^Bemærk:\s*/, '');

// --- Search page ---------------------------------------------------------------

export function parseSearchOptions(doc) {
  const options = (name) =>
    [...doc.querySelectorAll(`select[name$="${name}"] option`)].map((o) => ({ value: o.value, label: clean(o.textContent) }));
  return {
    seasons: options('ddlSeason'),
    districts: options('ddlDistrict_Rows').filter((o) => o.value !== '0'),
    genders: options('ddlGender'),
    divisions: options('ddlDivision'),
  };
}

export function parseRowList(doc) {
  return [...doc.querySelectorAll('table.srRowList tr')]
    .map((tr) => ({ ...link(tr.querySelector('td.c01'), 'RaekkeId'), note: clean(tr.querySelector('td.c02')?.textContent) }))
    .filter((r) => r.id);
}

export function parseClubList(doc) {
  return [...doc.querySelectorAll('table.srClubList tr')]
    .map((tr) => ({ ...link(tr.querySelector('td.c02'), 'ForeningsId'), district: clean(tr.querySelector('td.c03')?.textContent) }))
    .filter((c) => c.id);
}

export function parseMatchSearch(doc) {
  return param(doc.querySelector('a[href*="Kamp-Information.aspx"]'), 'KampId');
}

// --- League / group ------------------------------------------------------------

export function parsePoolList(doc) {
  return { title: headline(doc), pools: links(doc.querySelector('table.srPoolList'), 'PuljeId') };
}

export function parseStandings(doc) {
  const tables = [...doc.querySelectorAll('table.srPoolPosition')].map((table) => {
    const heading = table.previousElementSibling;
    const rows = [...table.querySelectorAll('tr.srOdd, tr.srEven')].map((tr) => {
      const cell = (c) => clean(tr.querySelector('td.' + c)?.textContent);
      return {
        pos: cell('c01'),
        team: link(tr.querySelector('td.c02'), 'HoldId'),
        played: cell('c04'),
        won: cell('c05'),
        lost: cell('c07'),
        setsWon: cell('c08'),
        setsLost: cell('c10'),
        balls: cell('c11'),
        points: cell('c12'),
      };
    });
    return { title: heading?.matches('h5') ? clean(heading.textContent) : '', rows };
  });
  return { title: headline(doc), note: comment(doc), tables: tables.filter((t) => t.rows.length) };
}

/** Pulje-/Hold-Kampprogram and Pulje-Komplet-Kampprogram (table.srProgramNormal). */
export function parseProgram(doc) {
  const calendar = doc.querySelector('a[href*="webcal://"]')?.getAttribute('href').match(/webcal:\/\/[^'"]+/)?.[0] ?? null;
  const matches = [...doc.querySelectorAll('table.srProgramNormal tr')]
    .filter((tr) => tr.querySelector('td.c01 a'))
    .map((tr) => {
      const td = (c) => tr.querySelector('td.' + c);
      return {
        id: param(td('c01').querySelector('a'), 'KampId'),
        number: clean(td('c01').textContent),
        date: parseDate(clean(td('c02').textContent)),
        home: link(td('c03'), 'HoldId'),
        away: link(td('c04'), 'HoldId'),
        venue: link(td('c05'), 'SpillestedsId'),
        court: lines(td('c05'))[1] ?? '',
        score: parseScore(td('c06').textContent),
      };
    });
  return { title: headline(doc), note: comment(doc), calendar, matches };
}

/** Spillested-Kampprogram (table.srProgramStadium): one venue, many leagues. */
export function parseVenueProgram(doc) {
  return [...doc.querySelectorAll('table.srProgramStadium tr')]
    .filter((tr) => tr.querySelector('td.c01 a'))
    .map((tr) => {
      const td = (c) => tr.querySelector('td.' + c);
      const [home, away] = links(td('c04'), 'HoldId');
      return {
        id: param(td('c01').querySelector('a'), 'KampId'),
        number: clean(td('c01').textContent),
        date: parseDate(clean(td('c02').textContent)),
        league: link(td('c03'), 'RaekkeId'),
        pool: links(td('c03'), 'PuljeId')[0] ?? null,
        home,
        away,
        court: clean(td('c05').textContent),
        score: parseScore(td('c06').textContent),
      };
    });
}

// --- Match ---------------------------------------------------------------------

export function parseMatch(doc) {
  const [infoTable, eventTable] = doc.querySelectorAll('table.srMatchInformation');
  const info = keyValues(infoTable);
  const txt = (k) => known(clean(info.get(k)?.textContent));
  const venueLines = lines(info.get('Spillested'));

  const sets = [...doc.querySelectorAll('table.srSubMatches tr.srOdd, table.srSubMatches tr.srEven')]
    .map((tr) => {
      const [home, away] = lines(tr.querySelector('td.c03'));
      return { label: clean(tr.querySelector('td.c01')?.textContent), home: home ?? '', away: away ?? '' };
    })
    .filter((s) => s.home !== '' || s.away !== '');

  const events = [...(eventTable?.querySelectorAll('tr') ?? [])]
    .filter((tr) => tr.querySelector('td'))
    .map((tr) => ({ score: clean(tr.querySelector('td.c01')?.textContent), text: clean(tr.querySelector('td.c02')?.textContent) }))
    .filter((e) => e.score && e.text);

  const pdf = (k) => webUrl(info.get(k)?.querySelector('a'));

  return {
    number: txt('Kampnummer'),
    round: txt('Rundenummer'),
    league: link(info.get('Række'), 'RaekkeId'),
    pool: link(info.get('Pulje'), 'PuljeId'),
    date: parseDate(txt('Tidspunkt')),
    venue: link(info.get('Spillested'), 'SpillestedsId'),
    address: venueLines.slice(1),
    court: txt('Bane'),
    home: link(info.get('Hjemmehold'), 'HoldId'),
    away: link(info.get('Udehold'), 'HoldId'),
    score: parseScore(txt('Kampresultat')),
    matchPoints: txt('Kamppoint'),
    referees: [...info.entries()]
      .filter(([label]) => label.startsWith('Dommer'))
      .map(([label, cell]) => ({ label, name: clean(cell.textContent) }))
      .filter((r) => known(r.name)),
    roster: pdf('Roster'),
    scoresheet: pdf('Kampskema'),
    sets,
    events,
  };
}

// --- Team, club, venue ---------------------------------------------------------

export function parseTeam(doc) {
  const info = keyValues(doc.querySelector('table.srTeamInformation'));
  const txt = (k) => known(clean(info.get(k)?.textContent));
  return {
    name: clean(doc.querySelector('h1.sr')?.textContent),
    poolTitle: headline(doc),
    league: link(info.get('Række'), 'RaekkeId'),
    pool: link(info.get('Pulje'), 'PuljeId'),
    club: link(info.get('Forening'), 'ForeningsId'),
    venue: link(info.get('Spillested'), 'SpillestedsId'),
    address: lines(info.get('Spillested')).slice(1),
    kit: [txt('Spilletøj 1'), txt('Spilletøj 2')].filter(Boolean),
  };
}

export function parseClub(doc) {
  const info = keyValues(doc.querySelector('table.srClubInformation'));
  const venues = [...doc.querySelectorAll('table.srClubStadiumInner')].map((t) => ({
    ...link(t.querySelector('tr.c01'), 'SpillestedsId'),
    address: lines(t.querySelector('tr:nth-child(2) td.c02')),
  }));
  return {
    name: headline(doc),
    district: link(info.get('Kreds'), 'KredsId')?.name ?? '',
    website: webUrl(info.get('Hjemmeside')?.querySelector('a')),
    venues: venues.filter((v) => v.id),
  };
}

export function parseClubTeams(doc) {
  return [...doc.querySelectorAll('table.srDefault tr')]
    .map((tr) => ({
      team: link(tr.querySelector('td.c01'), 'HoldId'),
      league: link(tr.querySelector('td.c02'), 'RaekkeId'),
      pool: link(tr.querySelector('td.c03'), 'PuljeId'),
    }))
    .filter((r) => r.team?.id);
}

export function parseVenue(doc) {
  const info = keyValues(doc.querySelector('table.srStadiumInformation'));
  return {
    name: headline(doc),
    address: lines(info.get('Adresse')),
    clubs: links(doc.querySelector('table.srStadiumClub'), 'ForeningsId'),
  };
}
