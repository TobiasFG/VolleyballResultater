<script>
  import { page } from '../api.js';
  import { parseTeam, parseProgram, parseStandings } from '../parse.js';
  import { byDate, startOfToday } from '../format.js';
  import { isFavorite, toggleFavorite } from '../favorites.svelte.js';
  import MatchList from '../components/MatchList.svelte';
  import VenueBlock from '../components/VenueBlock.svelte';
  import Crown from '../components/Crown.svelte';
  import Loading from '../components/Loading.svelte';
  import ErrorBox from '../components/ErrorBox.svelte';

  let { params } = $props();
  // svelte-ignore state_referenced_locally -- views are remounted on every route change
  const [id] = params;

  // The team's own schedule page only lists upcoming matches, so take results from its group's full schedule.
  const data = page(`Hold-Information.aspx?HoldId=${id}`).then(async ({ doc }) => {
    const team = parseTeam(doc);
    if (!team.pool?.id) return { team, upcoming: [], played: [], standing: null };
    const [program, standings] = await Promise.all([
      page(`Pulje-Komplet-Kampprogram.aspx?PuljeId=${team.pool.id}`).then((r) => parseProgram(r.doc)),
      page(`Pulje-Stilling.aspx?PuljeId=${team.pool.id}`).then((r) => parseStandings(r.doc)),
    ]);
    const mine = program.matches.filter((m) => m.home?.id === id || m.away?.id === id).sort(byDate);
    return {
      team,
      upcoming: mine.filter((m) => !m.score && (!m.date || m.date >= startOfToday())),
      played: mine.filter((m) => m.score),
      standing: standings.tables.flatMap((t) => t.rows).find((r) => r.team?.id === id) ?? null,
    };
  });

  const FEW = 3;
  let showEarlier = $state(false);
  let showAllUpcoming = $state(false);
  const chevron = 'size-4 fill-none stroke-ink stroke-[1.8]';
</script>

{#await data}
  <Loading />
{:then { team, upcoming, played, standing }}
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      <h1 class="page-title">{team.name}</h1>
      {#if team.pool?.id}
        <a href="#/pulje/{team.pool.id}" class="text-link mt-1.5 inline-block text-sm font-medium">{team.poolTitle}</a>
      {/if}
    </div>
    <button
      class="-mt-1 -mr-2.5 grid size-11 shrink-0 cursor-pointer place-items-center"
      aria-label={isFavorite(id) ? 'Fjern fra favoritter' : 'Føj til favoritter'}
      aria-pressed={isFavorite(id)}
      onclick={() => toggleFavorite({ id, name: team.name, poolId: team.pool?.id, poolTitle: team.poolTitle })}
    >
      <svg class="size-[26px] stroke-fav stroke-[1.8] {isFavorite(id) ? 'fill-fav' : 'fill-none'}" viewBox="0 0 24 24" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>
    </button>
  </div>

  <div class="lg:mt-9 lg:grid lg:grid-cols-[7fr_5fr] lg:items-start lg:gap-x-16 xl:gap-x-28">
  {#if standing}
    <div class="mt-6 grid grid-cols-3 lg:col-start-1 lg:mt-0 border-y border-line text-center tabular-nums">
      <div class="py-4">
        <div class="relative h-8 text-[26px] leading-8 font-bold tracking-[-0.02em]">
          {#if standing.pos === '1'}
            <Crown class="-top-3.5 left-1/2 -ml-[11px] h-[18px] w-[22px]" /><span class="gold">1</span>
          {:else}
            {standing.pos}
          {/if}
        </div>
        <div class="text-xs text-mute">Placering</div>
      </div>
      <div class="border-x border-line py-4">
        <div class="text-[26px] leading-8 font-bold tracking-[-0.02em]">{standing.points}</div>
        <div class="text-xs text-mute">Point</div>
      </div>
      <div class="py-4">
        <div class="text-[26px] leading-8 font-bold tracking-[-0.02em]">{standing.won}–{standing.lost}</div>
        <div class="text-xs text-mute">Vundne–tabte</div>
      </div>
    </div>
  {/if}

  <section class="mt-8 lg:col-start-1">
    <h2 class="mb-1 text-xl font-bold tracking-[-0.01em] lg:text-2xl">Kampe</h2>
    {#if played.length > 1}
      <button class="more-link cursor-pointer" onclick={() => (showEarlier = !showEarlier)}>
        <svg class={chevron} viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={showEarlier ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'} /></svg>
        {showEarlier ? 'Skjul tidligere resultater' : `Vis tidligere resultater (${played.length - 1})`}
      </button>
    {/if}
    {#if played.length}
      <MatchList matches={showEarlier ? played : played.slice(-1)} team={id} showTime={false} />
    {/if}
    <div class="upcoming-label">Kommende</div>
    <div class="mt-3.5">
      {#if upcoming.length}
        <MatchList matches={showAllUpcoming ? upcoming : upcoming.slice(0, FEW)} team={id} emphasizeFirst />
      {:else}
        <MatchList matches={[]} />
      {/if}
    </div>
    {#if upcoming.length > FEW}
      <button class="more-link cursor-pointer" onclick={() => (showAllUpcoming = !showAllUpcoming)}>
        <svg class={chevron} viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={showAllUpcoming ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} /></svg>
        {showAllUpcoming ? 'Vis færre' : `Vis alle kommende kampe (${upcoming.length})`}
      </button>
    {/if}
  </section>

  <section class="mt-8 flex flex-col gap-7 md:grid md:grid-cols-2 md:gap-x-12 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:flex lg:gap-8">
    {#if team.venue?.id}
      <VenueBlock label="Hjemmebane" venue={team.venue} address={team.address} />
    {/if}
    <div class="grid grid-cols-2 gap-x-6 gap-y-5">
      {#if team.club?.id}
        <div>
          <div class="mb-0.5 text-xs text-mute">Klub</div>
          <a href="#/klub/{team.club.id}" class="text-link text-base font-medium">{team.club.name}</a>
        </div>
      {/if}
      {#each team.kit as kit, i}
        <div>
          <div class="mb-0.5 text-xs text-mute">Spilletøj {i + 1}</div>
          <div class="text-base font-medium">{kit}</div>
        </div>
      {/each}
    </div>
  </section>
  </div>
{:catch error}
  <ErrorBox {error} />
{/await}
