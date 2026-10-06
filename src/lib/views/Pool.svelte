<script>
  import { page } from '../api.js';
  import { parseStandings, parseProgram } from '../parse.js';
  import { byDate } from '../format.js';
  import Standings from '../components/Standings.svelte';
  import MatchList from '../components/MatchList.svelte';
  import Loading from '../components/Loading.svelte';
  import ErrorBox from '../components/ErrorBox.svelte';

  let { params } = $props();
  // svelte-ignore state_referenced_locally -- views are remounted on every route change
  const [id, initialTab] = params;

  let tab = $state(initialTab ?? null);
  let showAllPlayed = $state(false);
  let showAllUpcoming = $state(false);

  /** From the preferred end of `list`, keep each match that is the first one found for at least one of its teams. */
  function onePerTeam(list) {
    const seen = new Set();
    return list.filter((m) => {
      const ids = [m.home?.id, m.away?.id].filter(Boolean);
      const fresh = ids.some((t) => !seen.has(t));
      ids.forEach((t) => seen.add(t));
      return fresh;
    });
  }

  const data = Promise.all([
    page(`Pulje-Stilling.aspx?PuljeId=${id}`).then(({ doc }) => parseStandings(doc)),
    page(`Pulje-Komplet-Kampprogram.aspx?PuljeId=${id}`).then(({ doc }) => parseProgram(doc)),
  ]).then(([standings, program]) => {
    // Cup rounds have no standings; open on the matches instead.
    tab ??= standings.tables.length ? 'stilling' : 'kampe';
    const sorted = program.matches.toSorted(byDate);
    const played = sorted.filter((m) => m.score);
    // Matches without a date go last among the upcoming ones.
    const upcoming = sorted.filter((m) => !m.score).sort((a, b) => !a.date - !b.date);
    return {
      standings,
      program,
      played,
      upcoming,
      // Each team's latest result and next match; a match between two teams counts for both.
      recent: onePerTeam(played.toReversed()).toReversed(),
      next: onePerTeam(upcoming),
    };
  });

  function select(next) {
    tab = next;
    history.replaceState(null, '', `#/pulje/${id}/${next}`);
  }

  const chevron = 'size-4 fill-none stroke-ink stroke-[1.8]';
</script>

{#await data}
  <Loading />
{:then { standings, program, played, upcoming, recent, next }}
  <h1 class="page-title">{program.title || standings.title}</h1>
  {#if program.note || standings.note}
    <p class="mt-1.5 text-sm text-mute">{program.note || standings.note}</p>
  {/if}
  <div class="mt-7 mb-6 flex gap-7 border-b border-line">
    {#each [['stilling', 'Stilling'], ['kampe', 'Kampe']] as [key, label]}
      <button
        class={['-mb-px cursor-pointer border-b-2 py-2.5 text-[15px]', tab === key ? 'border-ink font-semibold' : 'border-transparent text-mute']}
        onclick={() => select(key)}>{label}</button
      >
    {/each}
  </div>
  {#if tab === 'stilling'}
    {#if standings.tables.length}
      <div class="flex flex-col gap-6">
        {#each standings.tables as table}
          <div>
            {#if standings.tables.length > 1 && table.title}<h2 class="section-title mb-2">{table.title}</h2>{/if}
            <Standings {table} />
          </div>
        {/each}
        <p class="text-xs leading-normal text-mute">K kampe · V vundne · T tabte · Sæt og Bolde vundne–tabte · P point</p>
      </div>
    {:else}
      <p class="border-y border-line py-3.5 text-[15px] text-mute">Ingen stilling for denne pulje</p>
    {/if}
  {:else}
    {#if program.calendar}
      <a href={program.calendar} class="more-link mb-1 text-sm">
        <svg class="size-5 fill-none stroke-ink stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
        Abonnér på kampprogrammet i din kalender
      </a>
    {/if}
    <!-- One column on a phone; results and upcoming side by side from tablet width. -->
    <div class="md:mt-2 md:grid md:grid-cols-2 md:items-start md:gap-x-10 lg:gap-x-24">
      <div>
        {#if played.length}
          <h3 class="section-title mb-1 hidden md:block">Seneste resultater</h3>
          {#if played.length > recent.length}
            <button class="more-link cursor-pointer" onclick={() => (showAllPlayed = !showAllPlayed)}>
              <svg class={chevron} viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={showAllPlayed ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'} /></svg>
              {showAllPlayed ? 'Vis færre tidligere kampe' : `Vis alle tidligere kampe (${played.length})`}
            </button>
          {/if}
          <MatchList matches={showAllPlayed ? played : recent} />
        {/if}
      </div>
      <div>
        {#if upcoming.length}
          {#if played.length}<div class="upcoming-label md:hidden">Kommende</div>{/if}
          <h3 class="section-title mb-1 hidden md:block">Kommende</h3>
          <div class="mt-3.5 md:mt-0"><MatchList matches={showAllUpcoming ? upcoming : next} emphasizeFirst /></div>
          {#if upcoming.length > next.length}
            <button class="more-link cursor-pointer" onclick={() => (showAllUpcoming = !showAllUpcoming)}>
              <svg class={chevron} viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={showAllUpcoming ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} /></svg>
              {showAllUpcoming ? 'Vis færre kommende kampe' : `Vis alle kommende kampe (${upcoming.length})`}
            </button>
          {/if}
        {:else if !played.length}
          <MatchList matches={[]} />
        {/if}
      </div>
    </div>
  {/if}
{:catch error}
  <ErrorBox {error} />
{/await}
