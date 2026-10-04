<script>
  import { formatDay, formatTime, groupByDay, startOfToday } from '../format.js';

  /**
   * matches: parsed matches (already in the order to show)
   * team: HoldId to mark won/lost for
   * scrollToNext: jump to the first day that hasn't happened yet
   * showLeague / showVenue: extra line per match
   */
  let { matches, team = null, scrollToNext = false, showLeague = false, showVenue = true } = $props();

  const groups = $derived(groupByDay(matches));
  const nextIndex = $derived(groups.findIndex((g) => g.date >= startOfToday()));

  function scrollHere(node, enabled) {
    if (enabled) requestAnimationFrame(() => node.scrollIntoView({ block: 'start' }));
  }

  const side = (m, s) => {
    if (!m.score) return '';
    const [h, a] = m.score;
    const won = s === 'home' ? h > a : a > h;
    return won ? 'font-semibold' : 'text-slate-500 dark:text-slate-400';
  };

  function outcome(m) {
    if (!m.score || !team) return null;
    const home = m.home?.id === team;
    const [h, a] = m.score;
    return (home ? h > a : a > h) ? 'V' : 'T';
  }
</script>

{#if matches.length === 0}
  <p class="card p-4 text-center text-slate-500">Ingen kampe</p>
{/if}

<div class="space-y-4">
  {#each groups as group, i}
    <!-- scroll-mt clears the sticky header plus the pool page's sticky tabs -->
    <section class="scroll-mt-32" use:scrollHere={scrollToNext && i === nextIndex && i > 0}>
      <h3 class="section-title">{group.date ? formatDay(group.date) : 'Dato ikke fastsat'}</h3>
      <div class="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
        {#each group.matches as m (m.id)}
          {@const result = outcome(m)}
          <a href="#/kamp/{m.id}" class="row-link">
            <div class="w-12 shrink-0 text-sm text-slate-500 tabular-nums dark:text-slate-400">
              {m.date && (m.date.getHours() || m.date.getMinutes()) ? formatTime(m.date) : ''}
            </div>
            <div class="min-w-0 flex-1">
              {#if showLeague && m.league}
                <div class="truncate text-xs text-slate-500 dark:text-slate-400">{m.league.name}{m.pool ? ` · ${m.pool.name}` : ''}</div>
              {/if}
              <div class={['truncate', side(m, 'home'), team === m.home?.id && !m.score && 'font-medium text-blue-700 dark:text-blue-400']}>
                {m.home?.name ?? '–'}
              </div>
              <div class={['truncate', side(m, 'away'), team === m.away?.id && !m.score && 'font-medium text-blue-700 dark:text-blue-400']}>
                {m.away?.name ?? '–'}
              </div>
              {#if showVenue && m.venue}
                <div class="truncate text-xs text-slate-500 dark:text-slate-400">{m.venue.name}</div>
              {/if}
            </div>
            {#if result}
              <span
                class="grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold text-white {result === 'V' ? 'bg-emerald-600' : 'bg-rose-600'}"
                title={result === 'V' ? 'Vundet' : 'Tabt'}>{result}</span
              >
            {/if}
            {#if m.score}
              <div class="w-5 shrink-0 text-right text-lg leading-6 tabular-nums">
                <div class={side(m, 'home')}>{m.score[0]}</div>
                <div class={side(m, 'away')}>{m.score[1]}</div>
              </div>
            {:else}
              <svg class="size-5 shrink-0 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" /></svg>
            {/if}
          </a>
        {/each}
      </div>
    </section>
  {/each}
</div>
