<script>
  import { page } from '../api.js';
  import { parseProgram } from '../parse.js';
  import { byDate, formatShortDay, formatTime, startOfToday } from '../format.js';
  import { tone, toneClass } from '../results.js';
  import TeamName from './TeamName.svelte';

  let { fav } = $props();
  // svelte-ignore state_referenced_locally -- cards are keyed by team id
  const data = page(`Pulje-Komplet-Kampprogram.aspx?PuljeId=${fav.poolId}`).then(({ doc }) => {
    const mine = parseProgram(doc)
      .matches.filter((m) => m.home?.id === fav.id || m.away?.id === fav.id)
      .sort(byDate);
    return {
      last: mine.filter((m) => m.score).at(-1),
      next: mine.find((m) => !m.score && m.date >= startOfToday()),
    };
  });

  const side = (m) => (m.home?.id === fav.id ? 0 : 1);
  const opponent = (m) => [m.home, m.away][1 - side(m)];
  const where = (m) => (side(m) === 0 ? 'hjemme' : 'ude');
  const ownScore = (m) => (side(m) === 0 ? m.score : [m.score[1], m.score[0]]);
</script>

<div
  class="flex flex-col gap-3.5 border-b border-line py-[22px] first:pt-0 last:border-b-0 last:pb-0 md:gap-4 md:border-t md:border-b-0 md:py-0 md:pt-[18px] md:first:pt-[18px] md:last:pb-0 lg:gap-3.5 lg:border-t-0 lg:border-b lg:py-[22px] lg:first:pt-0 lg:last:border-b-0"
>
  <a href="#/hold/{fav.id}" class="block">
    <div class="text-lg font-semibold tracking-[-0.01em]"><TeamName team={fav} /></div>
    <div class="mt-0.5 text-[13px] text-mute">{fav.poolTitle}</div>
  </a>
  {#await data}
    <div class="text-sm text-mute">Henter…</div>
  {:then { last, next }}
    {#if next}
      <a href="#/kamp/{next.id}" class="flex items-baseline gap-3.5 md:grid md:grid-cols-[1fr_auto] md:gap-x-2 md:gap-y-1 lg:flex lg:gap-3.5">
        <span class="w-14 shrink-0 text-[11px] font-semibold tracking-[0.08em] uppercase md:col-span-2 md:w-auto lg:col-span-1 lg:w-14">Næste</span>
        <span class="min-w-0 flex-1 pr-3.5 text-[15px]"><TeamName team={opponent(next)} /> <span class="text-mute">{where(next)}</span></span>
        <span class="text-[13px] text-mute tabular-nums md:col-span-2 lg:col-span-1">{formatShortDay(next.date)} · {formatTime(next.date)}</span>
      </a>
    {/if}
    {#if last}
      <a href="#/kamp/{last.id}" class="flex items-baseline gap-3.5 md:grid md:grid-cols-[1fr_auto] md:gap-x-2 md:gap-y-1 lg:flex lg:gap-3.5">
        <span class="w-14 shrink-0 text-[11px] font-semibold tracking-[0.08em] text-mute uppercase md:col-span-2 md:w-auto lg:col-span-1 lg:w-14">Seneste</span>
        <span class="min-w-0 flex-1 pr-3.5 text-[15px]"><TeamName team={opponent(last)} /> <span class="text-mute">{where(last)}</span></span>
        <span class="text-[17px] font-bold tabular-nums {toneClass(tone(last.home, last.away, last.score, side(last)))}">{ownScore(last).join('–')}</span>
      </a>
    {/if}
    {#if !next && !last}
      <div class="text-mute">Ingen kampe i programmet</div>
    {/if}
  {:catch}
    <div class="text-sm text-loss">Kunne ikke hente kampe</div>
  {/await}
</div>
