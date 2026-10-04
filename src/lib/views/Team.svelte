<script>
  import { page } from '../api.js';
  import { parseTeam, parseProgram, parseStandings } from '../parse.js';
  import { byDate, mapsUrl, startOfToday } from '../format.js';
  import { isFavorite, toggleFavorite } from '../favorites.svelte.js';
  import MatchList from '../components/MatchList.svelte';
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
      played: mine.filter((m) => m.score).reverse(),
      standing: standings.tables.flatMap((t) => t.rows).find((r) => r.team?.id === id) ?? null,
    };
  });
</script>

{#await data}
  <Loading />
{:then { team, upcoming, played, standing }}
  <div class="flex items-start gap-3">
    <div class="min-w-0 flex-1">
      <h1 class="text-2xl font-bold">{team.name}</h1>
      {#if team.pool?.id}
        <a href="#/pulje/{team.pool.id}" class="text-sm text-blue-700 dark:text-blue-400">{team.poolTitle}</a>
      {/if}
    </div>
    <button
      class="grid size-11 shrink-0 place-items-center rounded-full border border-slate-200 text-2xl dark:border-slate-700"
      class:text-amber-500={isFavorite(id)}
      aria-label={isFavorite(id) ? 'Fjern fra mine hold' : 'Tilføj til mine hold'}
      aria-pressed={isFavorite(id)}
      onclick={() => toggleFavorite({ id, name: team.name, poolId: team.pool?.id, poolTitle: team.poolTitle })}
      >{isFavorite(id) ? '★' : '☆'}</button
    >
  </div>

  {#if standing}
    <div class="mt-4 grid grid-cols-3 gap-2 text-center">
      <div class="card py-3"><div class="text-2xl font-bold">{standing.pos}.</div><div class="text-xs text-slate-500">Placering</div></div>
      <div class="card py-3"><div class="text-2xl font-bold">{standing.points}</div><div class="text-xs text-slate-500">Point</div></div>
      <div class="card py-3">
        <div class="text-2xl font-bold">{standing.won}-{standing.lost}</div>
        <div class="text-xs text-slate-500">Vundne-tabte</div>
      </div>
    </div>
  {/if}

  <section class="mt-6">
    <h2 class="mb-3 text-lg font-bold">Kommende kampe</h2>
    {#if upcoming.length}
      <MatchList matches={upcoming} team={id} />
    {:else}
      <p class="card p-4 text-center text-slate-500">Ingen kommende kampe</p>
    {/if}
  </section>

  {#if played.length}
    <section class="mt-6">
      <h2 class="mb-3 text-lg font-bold">Resultater</h2>
      <MatchList matches={played} team={id} showVenue={false} />
    </section>
  {/if}

  <section class="mt-6">
    <h2 class="section-title">Info</h2>
    <div class="card divide-y divide-slate-100 text-sm dark:divide-slate-800">
      {#if team.club?.id}
        <a href="#/klub/{team.club.id}" class="row-link">
          <span class="w-24 shrink-0 text-slate-500">Klub</span><span class="flex-1 font-medium">{team.club.name}</span>
        </a>
      {/if}
      {#if team.venue?.id}
        <a href="#/spillested/{team.venue.id}" class="row-link">
          <span class="w-24 shrink-0 text-slate-500">Hjemmebane</span>
          <span class="flex-1"><span class="font-medium">{team.venue.name}</span><br />{team.address.join(', ')}</span>
        </a>
        {#if team.address.length}
          <a href={mapsUrl([team.venue.name, ...team.address])} target="_blank" rel="noopener" class="row-link text-blue-700 dark:text-blue-400">
            <span class="w-24 shrink-0"></span><span>Vis på kort ↗</span>
          </a>
        {/if}
      {/if}
      {#each team.kit as kit, i}
        <div class="flex gap-3 px-4 py-3">
          <span class="w-24 shrink-0 text-slate-500">Spilletøj {i + 1}</span><span>{kit}</span>
        </div>
      {/each}
    </div>
  </section>
{:catch error}
  <ErrorBox {error} />
{/await}
