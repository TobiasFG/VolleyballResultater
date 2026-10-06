<script>
  import { page } from '../api.js';
  import { parseClub, parseClubTeams } from '../parse.js';
  import TeamName from '../components/TeamName.svelte';
  import VenueBlock from '../components/VenueBlock.svelte';
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
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-1.5">
      <div class="text-[13px] text-mute">{club.district}</div>
      <h1 class="page-title">{club.name}</h1>
      {#if club.website}
        <a href={club.website} target="_blank" rel="noopener" class="text-link mt-1 text-sm font-medium">{club.website.replace(/^https?:\/\/|\/$/g, '')} ↗</a>
      {/if}
    </div>

    <div class="grid gap-8 md:grid-cols-[3fr_2fr] md:items-start md:gap-x-12 lg:grid-cols-[7fr_5fr] lg:gap-x-24">
    <section>
      <h2 class="section-title mb-1.5">Hold</h2>
      {#if teams.length}
        <div class="list">
          {#each teams as t (t.team.id)}
            <a href="#/hold/{t.team.id}" class="list-row min-h-[60px]">
              <div class="min-w-0">
                <div class="truncate text-base font-medium"><TeamName team={t.team} /></div>
                <div class="truncate text-[13px] text-mute">{t.league?.name}{t.pool ? ` · ${t.pool.name}` : ''}</div>
              </div>
              <svg class="size-[18px] shrink-0 fill-none stroke-mute stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </a>
          {/each}
        </div>
      {:else}
        <p class="border-y border-line py-3.5 text-[15px] text-mute">Ingen hold i denne sæson</p>
      {/if}
    </section>

    {#if club.venues.length}
      <section class="flex flex-col gap-6">
        <h2 class="section-title -mb-3">{club.venues.length > 1 ? 'Spillesteder' : 'Spillested'}</h2>
        {#each club.venues as venue (venue.id)}
          <VenueBlock {venue} address={venue.address} />
        {/each}
      </section>
    {/if}
    </div>
  </div>
{:catch error}
  <ErrorBox {error} />
{/await}
