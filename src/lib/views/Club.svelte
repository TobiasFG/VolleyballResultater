<script>
  import { page } from '../api.js';
  import { parseClub, parseClubTeams } from '../parse.js';
  import Loading from '../components/Loading.svelte';
  import ErrorBox from '../components/ErrorBox.svelte';

  let { params } = $props();
  // svelte-ignore state_referenced_locally -- views are remounted on every route change
  const [id] = params;

  const data = Promise.all([
    page(`Forening-Information.aspx?ForeningsId=${id}`).then(({ doc }) => parseClub(doc)),
    page(`Forening-Holdoversigt.aspx?ForeningsId=${id}`).then(({ doc }) => parseClubTeams(doc)),
  ]);
</script>

{#await data}
  <Loading />
{:then [club, teams]}
  <h1 class="text-2xl font-bold">{club.name}</h1>
  <p class="text-sm text-slate-500 dark:text-slate-400">{club.district}</p>
  {#if club.website}
    <a href={club.website} target="_blank" rel="noopener" class="mt-1 inline-block text-sm text-blue-700 dark:text-blue-400">
      {club.website.replace(/^https?:\/\/|\/$/g, '')} ↗
    </a>
  {/if}

  <section class="mt-6">
    <h2 class="section-title">Hold</h2>
    {#if teams.length}
      <div class="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
        {#each teams as t (t.team.id)}
          <a href="#/hold/{t.team.id}" class="row-link">
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium">{t.team.name}</div>
              <div class="truncate text-xs text-slate-500 dark:text-slate-400">{t.league?.name}{t.pool ? ` · ${t.pool.name}` : ''}</div>
            </div>
            <svg class="size-5 shrink-0 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" /></svg>
          </a>
        {/each}
      </div>
    {:else}
      <p class="card p-4 text-center text-slate-500">Ingen hold i denne sæson</p>
    {/if}
  </section>

  {#if club.venues.length}
    <section class="mt-6">
      <h2 class="section-title">Spillesteder</h2>
      <div class="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
        {#each club.venues as venue (venue.id)}
          <a href="#/spillested/{venue.id}" class="row-link">
            <div class="min-w-0 flex-1">
              <div class="font-medium">{venue.name}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{venue.address.join(', ')}</div>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}
{:catch error}
  <ErrorBox {error} />
{/await}
