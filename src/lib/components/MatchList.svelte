<script>
  import { formatDay, formatTime, groupByDay } from '../format.js';
  import { tone, toneClass } from '../results.js';
  import TeamName from './TeamName.svelte';

  /**
   * matches: parsed matches (already in the order to show)
   * team: HoldId of the team whose page this is (its name is emphasised and results get a V/T mark)
   * showLeague / showVenue / showTime: extra parts of each row
   * emphasizeFirst: ink instead of grey for the first day heading (the next match day)
   */
  let { matches, team = null, showLeague = false, showVenue = true, showTime = true, emphasizeFirst = false } = $props();
  const groups = $derived(groupByDay(matches));

  const won = (m, side) => (side === 0 ? m.score[0] > m.score[1] : m.score[1] > m.score[0]);

  function nameClass(m, side) {
    const own = team && [m.home, m.away][side]?.id === team;
    if (!m.score) return own ? 'font-semibold' : '';
    if (team) return own ? 'font-semibold' : 'text-mute';
    return won(m, side) ? 'font-semibold' : 'text-mute';
  }

  function scoreClass(m, side) {
    const colour = toneClass(tone(m.home, m.away, m.score, side));
    return [won(m, side) && 'font-bold', colour || (!won(m, side) && 'text-mute')];
  }

  function mark(m) {
    const side = m.home?.id === team ? 0 : 1;
    const colour = toneClass(tone(m.home, m.away, m.score, side));
    return { letter: won(m, side) ? 'V' : 'T', cls: colour || (won(m, side) ? 'text-ink' : 'text-mute') };
  }
</script>

{#if matches.length === 0}
  <p class="border-y border-line py-3.5 text-[15px] text-mute">Ingen kampe</p>
{/if}
<div class="flex flex-col gap-5">
  {#each groups as group, i}
    <section>
      <h3 class={['mb-1 text-xs font-semibold tracking-[0.08em] uppercase', emphasizeFirst && i === 0 ? 'text-ink' : 'text-mute']}>
        {group.date ? formatDay(group.date) : 'Dato ikke fastsat'}
      </h3>
      {#each group.matches as m (m.id)}
        <a href="#/kamp/{m.id}" class="flex items-center gap-4 border-b border-line py-2.5">
          {#if showTime}
            <div class="w-11 shrink-0 text-sm text-mute tabular-nums">
              {m.date && (m.date.getHours() || m.date.getMinutes()) ? formatTime(m.date) : ''}
            </div>
          {/if}
          <div class="min-w-0 flex-1 pr-3 text-base">
            {#if showLeague && m.league}
              <div class="truncate text-xs text-mute">{m.league.name}{m.pool ? ` · ${m.pool.name}` : ''}</div>
            {/if}
            <div class={nameClass(m, 0)}><TeamName team={m.home} /></div>
            <div class={nameClass(m, 1)}><TeamName team={m.away} /></div>
            {#if showVenue && m.venue}
              <div class="mt-[3px] truncate text-xs text-mute">{m.venue.name}</div>
            {/if}
          </div>
          {#if m.score}
            <div class="text-right text-xl leading-[1.3] tabular-nums">
              <div class={scoreClass(m, 0)}>{m.score[0]}</div>
              <div class={scoreClass(m, 1)}>{m.score[1]}</div>
            </div>
            {#if team}
              {@const r = mark(m)}
              <div class={['w-5 shrink-0 text-right text-[13px] font-bold', r.cls]}>{r.letter}</div>
            {/if}
          {:else}
            <svg class="size-[18px] shrink-0 fill-none stroke-mute stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          {/if}
        </a>
      {/each}
    </section>
  {/each}
</div>
