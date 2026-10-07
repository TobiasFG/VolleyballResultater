# Making "Kampforløb" smarter: feasibility analysis

Status: revised 2026-10-07 after researching the rules of the game and testing 13 real matches. Options 1-5 below are
implemented; the court view (who is on court) is analysed but not built.

## Question

The match page shows the upstream event log ("Kampforløb") as a flat list, newest first. It is long and repetitive.
Could it be made smarter, for example by combining consecutive "Point til X" lines into one "3 point til X"?
The revision asks a wider question: what is the most effective and accurate way to present this data, grounded in how
volleyball works, and can we show exactly who is on court at any moment?

## What changed in this revision

- The first version looked at one match. This one uses 13 matches with events (youth, cup, women, Mix, 5-setters,
  lower leagues) plus a wider scan across seasons to see where logs exist.
- Rules research changed the recommendation: the log supports better views than merged point lines (lead graph per set,
  side-out and break-point percentages), and the scoresheet PDF makes a court view possible.
- Data quirks found upstream (duplicates, anonymous libero swaps, manual corrections) are listed under
  "Data quality" and drive the design: unknown lines always fall back to raw text.

## What the data looks like

Source: the second `table.srMatchInformation` on `Kamp-Information.aspx`, already fetched and parsed by
`parseMatch` in `src/lib/parse.js` (fields `score` and `text` per row). No extra requests are needed for anything below.

Sample inspected: match 75419 (VK Raptus 3–1 ASV Aarhus.2), **327 events**:

| Event type | Example text | Count | Share |
|---|---|---|---|
| Point | `Point til VK Raptus` | 208 | 64% |
| Substitution | `ASV Aarhus.2 skifter libero Joakim Telling Berg(13) ind istedet for Asger Aagaard Mejdal Lauridsen(3)` | 95 | 29% |
| Timeout | `ASV Aarhus.2 har bedt om en timeout.` | 16 | 5% |
| Set start | `2. sæt startet` | 4 | 1% |
| Set won | `VK Raptus vinder 1. sæt` | 4 | 1% |

Observations that matter for the design:

- The list is **newest first**. It must be reversed before looking at sequences.
- The `score` column (`33 - 31`) is the score **after** a point event. Substitutions and timeouts carry the score they
  happen at. Several events can share a score, so ordering has to come from list position, not from the score.
- Point events name the team in full: `Point til <team name>`. The names equal the home and away names parsed from the
  same page, so matching is an exact string comparison, not a guess.
- Set boundaries are explicit (`N. sæt startet`, `<team> vinder N. sæt`).
- About 90% of the substitutions (84 of 95) are libero swaps (`skifter libero … ind/ud`), which are mostly noise.
- Substitution lines contain player names and shirt numbers. They are already public upstream, but they make the list heavy.
- The same page links two PDFs (`api.volleyball.dk/api/pdf/roster/` and `/scorecard/`, both `?matchID=<KampId>`). The
  roster is the squad with liberos marked "L". The scoresheet holds the starting six of every set in service order,
  who serves first, substitutions with the score at the change, and set times (see "Who is on court").

## How volleyball works, and what that means for the data

Sources: FIVB Official Volleyball Rules 2025-2028 and the Danish federation's (DVBF) regulations and 2025/2026 rule
change notes (links at the end).

- **Scoring.** Rally point. A set goes to 25, win by 2, no cap. The deciding set goes to 15, win by 2. Senior
  Danmarksturneringen is first to 3 sets; U15/U17 and Mix are best of 3; U20 best of 3 or 5; some cup rounds use a
  Golden Set to 15. So the number of sets and the target are not fixed. The app infers the target from the finished set
  score (a winner below 25 means a 15-point set).
- **Serve and rotation.** A team that wins a rally while receiving rotates one position clockwise and serves; the
  serving team keeps its server. Who serves a rally is therefore known from who won the previous rally. Only the very
  first rally of a set is unknown from the log alone. Set 1 and set 5 are decided by toss, sets 2-4 alternate.
- **Substitutions.** 6 per set in the FIVB 2025-28 text; DVBF's September 2026 change note says 8 (effective date not
  verified, so the limit is never hard-coded). A starter may leave once and return once, to the same position. In the
  13 sampled matches no team used more than 6 in a set; 1-4 is typical.
- **Libero.** Replaces back-row players only, cannot serve, swaps are unlimited and do not count as substitutions.
  A swap never changes rotation order.
- **Timeouts.** 2 per team per set. No technical timeouts at DVBF level.
- **What a point-by-point log can give us:** lead over time, scoring runs, side-out % (points won as receiver),
  break-point % (points won as server), timeouts in context, set point and deuce. **What it cannot:** the cause of a
  point (ace, kill, error), serve quality, attack type.

## Data quality (13 matches with events)

- Logs and scoresheets exist from about September 2025 (a September 2025 cup match has them, an October 2024 match does
  not). Older matches show no Kampforløb; this must not be treated as an error.
- **Duplicates.** 7 of 114 timeouts and some set-start markers (up to 3 in a row) are logged more than once. Consecutive
  identical timeout and set markers are de-duplicated. The first analysis's "16 timeouts" for match 75419 is 12 real ones.
- **Extra event types.** Warnings and penalties ("har fået tildelt en advarsel / straf"), "Der er sket en manuel
  ændring i kampskemaet." and anonymous libero swaps ("har lavet en ombytning af deres libero", no player named).
  These show as raw text (anonymous libero swaps are folded with the other libero swaps).
- **Names.** Team names in events equal the names on the page; matching is an exact string comparison. A name that
  matches neither team makes the line fall back to raw text.

## Option 1: lead graph per set

For each set, the lead (home minus away) after every rally, home above a zero line and away below. Marked on it:
timeouts (circle, on the calling team's edge), regular substitutions (short tick), set point (ring), scoring runs of
5+ (thicker line) and the extended part of the set from 24-24 (shaded band). Same vertical scale in all sets, so sets are
comparable. Tapping a graph selects a rally, opens that set in the list and highlights its row. Libero swaps are left
out of the graph because they are noise.

Why this form: the data's job is polarity (who is ahead, by how much) over time, which is what a diverging line shows.
It gives the shape of the set (comeback, runaway, tight finish) without reading any rows.

## Option 2: side-out and break-point

Per team, for the match and per set. The first rally of each set is left out because the log doesn't say who served it.
Each rally is counted once for the receiving team's side-out and once for the serving team's break point, so one
team's side-out % is always 100 minus the other team's break-point %. Both are shown because that is how the numbers are
usually read. Side-out % is the usual measure of how well a team converts reception, and is a published predictor of
winning. Labels are plain Danish ("Sideout", "Breakpoint") with a one-line explanation.

## Option 3: list grouped by set

One collapsible section per set, newest set first and open by default, headed with the set result. Rows inside:
consecutive points by the same team merge into "3 point i træk til X" (a single point keeps the upstream wording),
runs of 5+ get a badge ("7–0 serie") on the row where the run ends, the row where a team reaches set point gets a
"Sætbold" badge. Libero swaps are hidden behind a "Vis liberoskift (N)" toggle. Sets are numbered by their start marker.

Run lengths over the 13 matches (1,222 runs): 1 point 56%, 2 points 26%, 3 points 10%, 4 points 4%, 5+
about 3.5%. Merging alone saves few rows, which is why the badge is reserved for runs of 5+.

## Option 4: timeouts and substitutions in context

A timeout row says what led to it: "efter 4 point i træk til ASV Aarhus.2" (shown when the run is 2 or more). Across
the 13 matches all 107 distinct timeouts were called by the team that had just lost the last point, after a run of 1-6
(median 3). A substitution row shows "Ind: Name (no) · Ud: Name (no)".

## Option 5: raw fallback

Anything the classifier does not recognise is shown as the raw upstream line with its score, never dropped.

## Court view: who is on court (analysed, not built)

Yes, it is possible, with data from the scoresheet PDF.

- **Method.** Starting six per set in service order I-VI come from the PDF. Replay the log: a side-out rotates the
  receiving team one place; a substitution or libero swap replaces the named player in the position of the player it
  names. The first server per set is printed on the sheet.
- **Test.** A throwaway script (not in the repo) read the PDF with `pdftotext -bbox`, took the numbers on the "No. of
  starting player" row of each set box, and replayed 13 matches, checking that every substitution replaces a player who
  is on court and every libero swap targets a back-row position. 9 matches were fully consistent. 1 had two mismatches
  caused by the PDF extraction picking up a stray character in set 5. 3 desynced because of manual corrections or
  anonymous libero swaps. Any court view must therefore detect a desync and stop showing the court for the rest of that
  set.
- **Cost.** The PDFs live on another host (`api.volleyball.dk`), so the Worker needs a new route, and the browser or
  Worker needs a PDF text reader. A deciding set in a best-of-3 match uses the "set 5" box of the sheet.
- **Value.** Court diagram per rally, who is serving, per-player points while on court. Useful but heavier and
  fragile; it should come after the log-only views have proven themselves.

## Limits and risks

- **Free text.** There is no structured event type upstream. Classification relies on Danish phrasing (`Point til`,
  `skifter`, `har bedt om en timeout.`, `vinder N. sæt`, `N. sæt startet`). If upstream rewords these, parsing silently
  degrades. Mitigation: anchored patterns and the raw fallback.
- **Corrections upstream.** After a "manuel ændring" marker the log may not add up. The graph uses the scores printed on
  the point events, not its own count.
- **Set target when live.** An unfinished set is assumed to go to 25 (15 for set 5). A live third set in a best-of-3 match
  can therefore get a wrong set-point marker until it finishes.
- **No serve or rotation data in the log.** Only the first rally of each set is excluded from side-out / break-point.
- **Proxy / network.** No extra requests for options 1-5. About 200-360 events per match, so performance is a
  non-issue.
- **Not verified:** DVBF's cup set format for early rounds, the effective date of 8 substitutions, and official Danish
  terms for "sideout", "breakpoint", "sætbold" and "serie" (taken from common usage).

## Design

Designed first in the design artifact ("Volleyball Resultater Redesign", component `MatchLog`, boards for phone light and
dark, tablet and desktop, plus a variant with an extended set), then implemented.

- Two teams use two colours from the validated chart palette: blue (home, above the line) and orange (away, below).
  Checked against the app's light and dark backgrounds: all checks pass. Team identity is never colour alone (names,
  position above/below the line, legend).
- Order on the page: key figures, graphs, then the list.
- Tablet and desktop show the graphs two per row.

## Recommendation

Ship options 1-5 (done). Treat the court view as a second phase: it needs a PDF route and parser, is correct on about
70% of matches in the sample, and needs desync detection. Before building it, check a few more match types.

## How the numbers were produced

Matches were fetched from the upstream site (match ids 73901, 74341, 75225, 75227, 75252, 75302, 75419, 75692, 76140,
77379, 77438, 77496, 77845 for events; further ids across seasons to see where logs exist), reversed to chronological
order and classified by prefix and keyword. Run lengths count consecutive `Point til <same team>` lines ignoring other
events; timeout counts exclude consecutive identical lines. The lineup test used the scoresheet PDFs of the same matches.

## Sources

- FIVB Official Volleyball Rules 2025-2028: https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf
- FIVB 2026 rule tests (8 substitutions): https://www.fivb.com/fivb-board-of-administration-approves-rule-tests-for-2026-competitions/
- DVBF rule changes 2026: https://volleyball.dk/wp-content/uploads/2026/09/Aendringer-i-regler-2026.pdf
- DVBF rule changes 2025-2028: https://volleyball.dk/wp-content/uploads/2025/09/Aendringer-i-regler-2025-2028.pdf
- DVBF Danmarksturneringen propositions and youth rules (set formats): https://www.volleyball.dk/reglementer/
- Side-out and break-point definitions: https://smartervolley.substack.com/p/sideout-what-is-it-good-for
