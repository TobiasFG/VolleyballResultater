# Making "Kampforløb" smarter: feasibility analysis

Status: analysis only, no code changed. Written 2026-10-07.

## Question

The match page shows the upstream event log ("Kampforløb") as a flat list, newest first. It is long and repetitive.
Could it be made smarter, for example by combining consecutive "Point til X" lines into one "3 point til X"?

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

## Option A: combine consecutive point events (the original idea)

Feasible and cheap (a small pass over the reversed list), but the payoff is modest in the sample:

| Run rule | Point events | Runs | Run length 1 / 2 / 3 / 4 |
|---|---|---|---|
| Any other event ends a run | 208 | 162 | 129 / 22 / 9 / 2 |
| Substitutions are ignored (timeouts and set changes still end a run) | 208 | 134 | 81 / 37 / 11 / 5 |

Roughly 80% (strict) or 60% (lenient) of runs are a single point and the longest is 4, so only a minority of rows would
actually read "3 point i træk". Worth doing, but not enough on its own.

## Option B: collapse substitutions

Group consecutive substitution lines into one expandable row ("3 udskiftninger"), or hide libero swaps by default.
Removes about 29% of the rows in the sample, which is more than Option A. Trivial to implement.

## Option C: group by set

Split the log with the set start and set won markers and render one section per set, with a header such as
"1. sæt · VK Raptus vandt 25–19". Sections can be collapsed, with the latest or all sets open. This is the largest
structural improvement and makes A and B easier to read. Moderate effort.

## Option D: annotate timeouts and key moments

In the sample every timeout (16 of 16) followed a run of 1–4 points by the **opposing** team, so a row like
"Timeout VK Raptus · efter 3 point i træk til ASV Aarhus.2" is possible. Set point and match point cannot be derived
reliably (the rules vary by set and competition), so those are out of scope unless the rules are encoded.

## Option E: lead chart per set

A small line or bar chart of the point difference over the set, built from the point sequence only. Gives an overview
without reading any rows. Most work of the options here; independent of the others.

## Limits and risks

- **Free text.** There is no structured event type upstream. Classification relies on Danish phrasing (`Point til`,
  `skifter`, `har bedt om en timeout.`, `vinder N. sæt`, `N. sæt startet`). If upstream rewords these, parsing silently
  degrades. Mitigation: classify with anchored patterns and always fall back to showing the raw line for anything
  unrecognised.
- **No serve or rotation data.** "Service runs" cannot be computed, only consecutive points.
- **Sample size.** Only one match was inspected. Older matches, cup matches or manually entered results may have no
  event log, or different wording. Check a handful before building.
- **Ordering.** Reverse the list first, and rely on list position within a shared score.
- **Proxy / network.** No impact: all data is already on the page the app fetches and parses. About 330 rows per match,
  so performance is a non-issue.

## Recommendation

Do A, B and C together: set sections, substitutions collapsed, point runs merged, timeouts annotated (D) when cheap,
raw text as the fallback for every unrecognised line. Leave E for later. Before building, sample a few more matches
(a cup match, an older season, a match with a walkover) to confirm the wording and that logs exist. Design work for the
new Kampforløb layout should happen in the design artifact first.

## How the numbers were produced

The event table of match 75419 was fetched through the local worker
(`/api/page/Kamp-Information.aspx?KampId=75419`), reversed to chronological order and classified by prefix and keyword
as listed above. Run lengths count consecutive `Point til <same team>` lines under the two rules in Option A.
