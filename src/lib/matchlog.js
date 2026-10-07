// Turns the upstream event log ("Kampforløb") into per-set data for the match page.
// Pure functions, no DOM. Events arrive newest first as { score: '12 - 9', text }.
// The log is free text, so every line we cannot classify is kept as a raw 'other' item.

export const RUN_MIN = 5;

const SUB = /^(.+?) skifter (libero )?(.+)\((\d+)\) (ind|ud) istedet for (.+)\((\d+)\)$/;
const TIMEOUT = /^(.+?) har bedt om en timeout\.$/;
const SET_START = /^(\d+)\. sæt startet$/;
const SET_WON = /^(.+) vinder (\d+)\. sæt$/;
const LIBERO_ANON = /^(.+?) har lavet en ombytning af deres libero$/;

const parseScore = (s) => {
  const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  return m ? [+m[1], +m[2]] : null;
};
export const showScore = (s) => s.replace(/\s*-\s*/, '–');

function classify(e, names) {
  const side = (name) => names.indexOf(name?.trim());
  const t = e.text;
  let m;
  if (t.startsWith('Point til ')) {
    const team = side(t.slice('Point til '.length));
    if (team >= 0) return { kind: 'point', team };
  } else if ((m = t.match(TIMEOUT))) {
    const team = side(m[1]);
    if (team >= 0) return { kind: 'timeout', team };
  } else if ((m = t.match(SET_START))) {
    return { kind: 'setstart', n: +m[1] };
  } else if ((m = t.match(SET_WON))) {
    return { kind: 'setwon', n: +m[2] };
  } else if ((m = t.match(SUB))) {
    const team = side(m[1]);
    const libero = !!m[2];
    if (team >= 0 && (libero || m[5] === 'ind')) {
      return { kind: libero ? 'libero' : 'sub', team, dir: m[5], who: `${m[3].trim()} (${m[4]})`, other: `${m[6].trim()} (${m[7]})` };
    }
  } else if ((m = t.match(LIBERO_ANON))) {
    const team = side(m[1]);
    if (team >= 0) return { kind: 'libero', team, dir: null };
  }
  return { kind: 'other' };
}

const newSet = (n) => ({ n, rallies: [], items: [], finished: false, final: null });

/** events: newest first, names: [home, away]. Returns { sets, maxLead, stats }. */
export function buildLog(events, names) {
  const chrono = events.slice().reverse();
  const sets = [];
  let cur = null;
  let prev = null;

  for (const e of chrono) {
    const c = classify(e, names);
    // Some lines (timeouts, set markers) are logged twice in a row upstream.
    if (prev && prev.text === e.text && prev.score === e.score && ['timeout', 'setstart', 'setwon'].includes(c.kind)) continue;
    prev = e;

    if (c.kind === 'setstart') {
      cur = newSet(c.n);
      sets.push(cur);
      continue;
    }
    if (!cur) {
      cur = newSet(sets.length + 1);
      sets.push(cur);
    }
    const k = cur.rallies.length;
    if (c.kind === 'point') {
      const score = parseScore(e.score) ?? [0, 0];
      cur.rallies.push({ team: c.team, h: score[0], a: score[1] });
      cur.items.push({ kind: 'point', team: c.team, k: k + 1, score: showScore(e.score) });
    } else if (c.kind === 'setwon') {
      cur.finished = true;
      cur.final = parseScore(e.score);
    } else if (c.kind === 'timeout') {
      const { run, runTeam } = streak(cur.rallies);
      cur.items.push({ kind: 'timeout', team: c.team, k, score: showScore(e.score), run: runTeam === 1 - c.team ? run : 0 });
    } else if (c.kind === 'other') {
      cur.items.push({ kind: 'other', k, score: showScore(e.score), text: e.text });
    } else {
      cur.items.push({ ...c, k, score: showScore(e.score) });
    }
  }
  for (const s of sets) analyse(s);

  const maxLead = Math.max(6, ...sets.flatMap((s) => s.rallies.map((r) => Math.abs(r.h - r.a))));
  return { sets, maxLead, stats: stats(sets) };
}

function streak(rallies) {
  const last = rallies.at(-1);
  if (!last) return { run: 0, runTeam: -1 };
  let run = 1;
  while (run < rallies.length && rallies[rallies.length - 1 - run].team === last.team) run++;
  return { run, runTeam: last.team };
}

function analyse(s) {
  const n = s.rallies.length;
  const last = s.rallies.at(-1);
  s.score = s.final ?? (last ? [last.h, last.a] : [0, 0]);
  s.target = s.finished ? (Math.max(...s.score) >= 25 ? 25 : 15) : s.n === 5 ? 15 : 25;

  // Scoring runs of RUN_MIN or more: startK..endK are the rally numbers (1-based) the run covers.
  s.runs = [];
  let start = 0;
  for (let i = 1; i <= n; i++) {
    if (i === n || s.rallies[i].team !== s.rallies[i - 1].team) {
      if (i - start >= RUN_MIN) s.runs.push({ team: s.rallies[start].team, startK: start + 1, endK: i, len: i - start });
      start = i;
    }
  }

  // A team has set point when one more rally wins the set. Marked when it arises, not on every rally while it lasts.
  const holder = (r) => (r && Math.max(r.h, r.a) >= s.target - 1 && r.h !== r.a ? (r.h > r.a ? 0 : 1) : -1);
  s.setPoints = [];
  const lastK = s.finished ? n - 1 : n;
  for (let k = 1; k <= lastK; k++) {
    const now = holder(s.rallies[k - 1]);
    if (now >= 0 && now !== holder(s.rallies[k - 2])) s.setPoints.push({ k, team: now });
  }

  const deuce = s.rallies.findIndex((r) => r.h >= s.target - 1 && r.a >= s.target - 1);
  s.deuceFrom = deuce >= 0 ? deuce + 1 : null;
}

// Side-out: a rally won by the receiving team. Break point: a rally won by the serving team.
// The server of a rally is whoever won the previous one, so the first rally of a set is skipped.
function stats(sets) {
  const blank = () => ({ so: [[0, 0], [0, 0]], bp: [[0, 0], [0, 0]] });
  const count = (list) => {
    const c = blank();
    for (const s of list) {
      for (let i = 1; i < s.rallies.length; i++) {
        const server = s.rallies[i - 1].team;
        const receiver = 1 - server;
        const winner = s.rallies[i].team;
        c.so[receiver][1]++;
        c.bp[server][1]++;
        c.so[receiver][0] += winner === receiver;
        c.bp[server][0] += winner === server;
      }
    }
    return c;
  };
  return { total: count(sets), perSet: sets.map((s) => count([s])) };
}

/** Rows for the list under one set, newest first. Consecutive points by one team become one row. */
export function listRows(set, showLibero) {
  const rows = [];
  for (const item of set.items) {
    if (item.kind === 'libero' && !showLibero) continue;
    const last = rows.at(-1);
    if (item.kind === 'point') {
      if (last?.kind === 'point' && last.team === item.team) {
        last.count++;
        last.to = item.k;
        last.score = item.score;
        continue;
      }
      rows.push({ kind: 'point', team: item.team, count: 1, from: item.k, to: item.k, score: item.score });
    } else {
      rows.push({ ...item, from: item.k, to: item.k });
    }
  }
  for (const row of rows) {
    if (row.kind !== 'point') continue;
    row.run = set.runs.find((r) => r.team === row.team && r.endK >= row.from && r.endK <= row.to)?.len ?? 0;
    row.setPoint = set.setPoints.some((p) => p.k >= row.from && p.k <= row.to);
  }
  return rows.reverse();
}

export const liberoCount = (sets) => sets.reduce((n, s) => n + s.items.filter((i) => i.kind === 'libero').length, 0);
