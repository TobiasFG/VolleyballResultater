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
      return { kind: libero ? 'libero' : 'sub', team, dir: m[5], who: `${m[3].trim()} (${m[4]})`, other: `${m[6].trim()} (${m[7]})`, inNo: +m[4], outNo: +m[7] };
    }
  } else if ((m = t.match(LIBERO_ANON))) {
    const team = side(m[1]);
    if (team >= 0) return { kind: 'libero', team, dir: null };
  }
  return { kind: 'other' };
}

const newSet = (n) => ({ n, rallies: [], items: [], finished: false, final: null });

/**
 * events: newest first, names: [home, away], sheet: parsed scoresheet (scoresheet.js) or null.
 * Returns { sets, maxLead, stats, serve }. With a sheet, each set also gets `first` (team serving first),
 * `lineups` and `rotations`, and `serve` holds per-player serve figures.
 */
export function buildLog(events, names, sheet = null) {
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
  // Log sets and sheet sets are both in playing order.
  if (sheet) sets.forEach((s, i) => sheet.sets[i] && replay(s, sheet.sets[i], names, sheet.players));

  const maxLead = Math.max(6, ...sets.flatMap((s) => s.rallies.map((r) => Math.abs(r.h - r.a))));
  return { sets, maxLead, stats: stats(sets), serve: sheet ? serveTable(sets, sheet, names) : null, participation: sheet ? participation(sets, sheet, names) : null };
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

// Replays a set from the sheet's starting lineups. A team rotates when it wins a rally as receiver, and the player
// in the serving column then serves. rot[t] is the column (0-5 = I-VI) in the serving position.
// The replay is checked against the sheet's service rounds; on a mismatch the set keeps only the first server.
function replay(s, sheetSet, names, players) {
  const team = sheetSet.sides.map((side) => names.indexOf(side.name));
  if (team[0] < 0 || team[1] < 0 || team[0] === team[1]) return;
  s.minutes = sheetSet.minutes;
  s.first = team[0];
  if (!s.rallies.length) return;

  const lineup = [];
  for (const [j, t] of team.entries()) lineup[t] = sheetSet.sides[j].lineup.slice();
  const lineups = lineup.map((l) => l.slice());
  const rotations = [0, 1].map(() => Array.from({ length: 6 }, () => ({ won: 0, lost: 0 })));
  const turns = [[], []];
  const rot = [0, 0];
  let server = s.first;
  let turn = { pos: 0, no: lineup[server][0], served: 0, points: 0 };
  const known = [true, true];
  // Who came in as a substitute (not in the starting six), per team.
  const subbedIn = [new Set(), new Set()];
  // Libero: lib[t] = { L, P } while libero L stands in for back-row player P. "ind"/"ud" lines name both; an anonymous
  // "ombytning af deres libero" is the team's two liberos swapping, P stays off court (checked on 18 matches).
  // A libero can never be in the front row; if the log puts her there, that set's libero data is not trusted.
  const liberos = [0, 1].map((t) => (players?.[names[t]] ?? []).filter((p) => p.libero).map((p) => p.no));
  const lib = [null, null];
  const liberoOk = [true, true];
  // Per rally: the six rotation players, who was actually on court (with the libero) and the rotation, per team.
  const lineupAt = [[], []];
  const courtAt = [[], []];
  const rotAt = [];
  const posOf = (t, no) => ((lineup[t].indexOf(no) - rot[t] + 6) % 6) + 1;
  const own = (r, t) => (t === 0 ? r.h : r.a);

  for (const item of s.items) {
    if (item.kind === 'sub') {
      const k = lineup[item.team].indexOf(item.outNo);
      if (k >= 0) lineup[item.team][k] = item.inNo;
      else known[item.team] = false;
      if (!lineups[item.team].includes(item.inNo)) subbedIn[item.team].add(item.inNo);
      if (lib[item.team]?.P === item.outNo) lib[item.team].P = item.inNo;
      continue;
    }
    if (item.kind === 'libero') {
      const t = item.team;
      if (item.dir === 'ind') lib[t] = { L: item.inNo, P: lib[t]?.L === item.outNo ? lib[t].P : item.outNo };
      else if (item.dir === 'ud') lib[t] = null;
      else {
        const other = liberos[t].find((no) => no !== lib[t]?.L);
        if (lib[t] && other !== undefined) lib[t].L = other;
        else liberoOk[t] = false;
      }
      continue;
    }
    if (item.kind !== 'point') continue;
    const r = s.rallies[item.k - 1];
    rotAt.push(rot.slice());
    for (const t of [0, 1]) {
      rotations[t][rot[t]][r.team === t ? 'won' : 'lost']++;
      if (lib[t] && [2, 3, 4].includes(posOf(t, lib[t].P))) liberoOk[t] = false;
      lineupAt[t].push(lineup[t].slice());
      courtAt[t].push(lineup[t].map((no) => (lib[t]?.P === no ? lib[t].L : no)));
    }
    turn.served++;
    if (r.team === server) {
      turn.points++;
      continue;
    }
    turns[server].push({ ...turn, end: own(r, server) });
    rot[r.team] = (rot[r.team] + 1) % 6;
    server = r.team;
    turn = { pos: rot[server], no: known[server] ? lineup[server][rot[server]] : null, served: 0, points: 0 };
  }
  // A set won on a side-out still ends with the score written under the next server, who never served.
  if (turn.served || s.finished) turns[server].push({ ...turn, end: own(s.rallies.at(-1), server) });

  // The sheet lists, per column, the team's score each time that server lost the serve (or the set ended).
  // During a live set the sheet and the log are cached separately and either may be ahead, so only the part both
  // have is compared.
  const matches = team.every((t, j) =>
    sheetSet.sides[j].rounds.every((ends, pos) => {
      const replayed = turns[t].filter((x) => x.pos === pos).map((x) => x.end);
      return s.finished ? ends.join() === replayed.join() : ends.every((e, i) => i >= replayed.length || e === replayed[i]);
    }),
  );
  if (!matches) return;
  s.lineups = lineups;
  s.rotations = rotations;
  s.turns = turns;
  // Rallies on court per shirt number; without trusted libero data the six rotation players are counted.
  const onCourt = [new Map(), new Map()];
  for (const t of [0, 1]) {
    if (!liberoOk[t]) courtAt[t] = lineupAt[t];
    if (known[t]) for (const court of courtAt[t]) for (const no of court) onCourt[t].set(no, (onCourt[t].get(no) ?? 0) + 1);
  }
  s.played = { subbedIn, onCourt, known, liberoOk, lineupAt, courtAt, rotAt };
}

// Below this many serves a player's success rate is too noisy to rank by.
export const SERVE_MIN = 5;

// Per team: one row per player who served, summed over the sets where the replay matched the sheet.
// Sorted by success rate (rallies won on own serve / serves), players with few serves last.
function serveTable(sets, sheet, names) {
  return [0, 1].map((t) => {
    const roster = sheet.players[names[t]] ?? [];
    const rows = new Map();
    for (const s of sets) {
      for (const turn of s.turns?.[t] ?? []) {
        if (turn.no === null || !turn.served) continue;
        const row = rows.get(turn.no) ?? { no: turn.no, name: roster.find((p) => p.no === turn.no)?.name ?? '', turns: 0, served: 0, points: 0, best: 0 };
        row.turns++;
        row.served += turn.served;
        row.points += turn.points;
        row.best = Math.max(row.best, turn.points);
        rows.set(turn.no, row);
      }
    }
    const rate = (r) => r.points / r.served;
    return [...rows.values()].sort((a, b) => (b.served >= SERVE_MIN) - (a.served >= SERVE_MIN) || rate(b) - rate(a) || b.served - a.served || a.no - b.no);
  });
}

// Per team: sets started, sets entered as a substitute and share of the team's rallies on court (libero included), per
// player, over the sets where the replay matched the sheet. Sorted by share of rallies, most first.
function participation(sets, sheet, names) {
  return [0, 1].map((t) => {
    const roster = sheet.players[names[t]] ?? [];
    const rows = new Map();
    const row = (no) => {
      if (!rows.has(no)) {
        const player = roster.find((p) => p.no === no);
        rows.set(no, { no, name: player?.name ?? '', libero: !!player?.libero, started: 0, subbed: 0, rallies: 0 });
      }
      return rows.get(no);
    };
    let rallies = 0;
    for (const s of sets) {
      if (!s.played?.known[t]) continue;
      rallies += s.rallies.length;
      for (const no of s.lineups[t]) row(no).started++;
      for (const no of s.played.subbedIn[t]) row(no).subbed++;
      for (const [no, n] of s.played.onCourt[t]) row(no).rallies += n;
    }
    const untracked = sets.filter((s) => s.played?.known[t] && !s.played.liberoOk[t]).length;
    return { rallies, untracked, rows: [...rows.values()].sort((a, b) => b.rallies - a.rallies || a.no - b.no) };
  });
}

// Rotations for one team, counted from the marked setters (shirt numbers). For every rally the setter is the marked
// player in the rotation lineup (two in it, as in a 6-2: the one in the back row), and the rotation is her position:
// H1 = she serves, H2-H4 front row. Following the person rather than the slot keeps a double switch (setter and
// opposite swapped) correct. Rallies without a marked setter, or with no setters marked, are grouped by the server.
// Only sets where the replay matched the sheet are used. Returns groups { setter, z, server, rallies, net, lineups,
// liberoFor }: lineups counts each rotation lineup, liberoFor counts, per player, the rallies a libero stood in.
export function setterRotations(sets, t, setters) {
  const groups = new Map();
  for (const s of sets) {
    if (!s.played?.known[t]) continue;
    s.rallies.forEach((r, i) => {
      const lineup = s.played.lineupAt[t][i];
      const court = s.played.courtAt[t][i];
      const rot = s.played.rotAt[i][t];
      const posOf = (no) => ((lineup.indexOf(no) - rot + 6) % 6) + 1;
      const on = setters.filter((no) => lineup.includes(no));
      const active = on.find((no) => ![2, 3, 4].includes(posOf(no))) ?? on[0];
      const z = active === undefined ? 0 : posOf(active);
      const key = active === undefined ? `S${lineup[rot]}` : `${active}H${z}`;
      if (!groups.has(key)) groups.set(key, { setter: active ?? null, z, server: active === undefined ? lineup[rot] : null, rallies: 0, net: 0, lineups: new Map(), liberoFor: new Map() });
      const g = groups.get(key);
      g.rallies++;
      g.net += r.team === t ? 1 : -1;
      const sorted = lineup.slice().sort((a, b) => a - b).join(',');
      g.lineups.set(sorted, (g.lineups.get(sorted) ?? 0) + 1);
      lineup.forEach((no, k) => {
        if (court[k] === no) return;
        const by = g.liberoFor.get(no) ?? new Map();
        by.set(court[k], (by.get(court[k]) ?? 0) + 1);
        g.liberoFor.set(no, by);
      });
    });
  }
  return [...groups.values()];
}

// Side-out: a rally won by the receiving team. Break point: a rally won by the serving team.
// The server of a rally is whoever won the previous one; for the first rally of a set it comes from the scoresheet,
// and without one that rally is skipped.
function stats(sets) {
  const blank = () => ({ so: [[0, 0], [0, 0]], bp: [[0, 0], [0, 0]] });
  const count = (list) => {
    const c = blank();
    for (const s of list) {
      for (let i = s.first === undefined ? 1 : 0; i < s.rallies.length; i++) {
        const server = i ? s.rallies[i - 1].team : s.first;
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
