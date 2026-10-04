<script>
  import { page } from '../api.js';
  import { parseProgram } from '../parse.js';
  import { byDate, formatShortDay, formatTime, startOfToday } from '../format.js';

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

  const opponent = (m) => (m.home?.id === fav.id ? `${m.away?.name} (hjemme)` : `${m.home?.name} (ude)`);
  const won = (m) => (m.home?.id === fav.id ? m.score[0] > m.score[1] : m.score[1] > m.score[0]);
  const ownScore = (m) => (m.home?.id === fav.id ? m.score : [m.score[1], m.score[0]]);
</script>

<div class="card overflow-hidden">
  <a href="#/hold/{fav.id}" class="block px-4 pt-3 pb-2">
    <div class="font-semibold">{fav.name}</div>
    <div class="text-xs text-slate-500 dark:text-slate-400">{fav.poolTitle}</div>
  </a>
  {#await data}
    <div class="px-4 pb-3 text-sm text-slate-400">Henter…</div>
  {:then { last, next }}
    <div class="divide-y divide-slate-100 border-t border-slate-100 text-sm dark:divide-slate-800 dark:border-slate-800">
      {#if next}
        <a href="#/kamp/{next.id}" class="row-link py-2.5">
          <span class="w-16 shrink-0 text-xs font-medium text-blue-700 uppercase dark:text-blue-400">Næste</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate">{opponent(next)}</span>
            <span class="block text-xs text-slate-500 dark:text-slate-400">{formatShortDay(next.date)} kl. {formatTime(next.date)}</span>
          </span>
        </a>
      {/if}
      {#if last}
        <a href="#/kamp/{last.id}" class="row-link py-2.5">
          <span class="w-16 shrink-0 text-xs font-medium text-slate-500 uppercase dark:text-slate-400">Seneste</span>
          <span class="min-w-0 flex-1 truncate">{opponent(last)}</span>
          <span
            class="shrink-0 rounded-md px-1.5 font-semibold text-white tabular-nums {won(last) ? 'bg-emerald-600' : 'bg-rose-600'}"
          >
            {ownScore(last).join('-')}
          </span>
        </a>
      {/if}
      {#if !next && !last}
        <div class="px-4 py-2.5 text-slate-500">Ingen kampe i programmet</div>
      {/if}
    </div>
  {:catch}
    <div class="px-4 pb-3 text-sm text-rose-600">Kunne ikke hente kampe</div>
  {/await}
</div>
