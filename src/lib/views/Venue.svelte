<script>
  import { page } from '../api.js';
  import { parseVenue, parseVenueProgram } from '../parse.js';
  import { byDate, mapsUrl } from '../format.js';
  import MatchList from '../components/MatchList.svelte';
  import Loading from '../components/Loading.svelte';
  import ErrorBox from '../components/ErrorBox.svelte';

  let { params } = $props();
  // svelte-ignore state_referenced_locally -- views are remounted on every route change
  const [id] = params;

  // The venue schedule defaults to today and the following six months.
  const data = Promise.all([
    page(`Spillested-Information.aspx?SpillestedsId=${id}`).then(({ doc }) => parseVenue(doc)),
    page(`Spillested-Kampprogram.aspx?SpillestedsId=${id}`).then(({ doc }) => parseVenueProgram(doc).sort(byDate)),
  ]);
</script>

{#await data}
  <Loading />
{:then [venue, matches]}
  <h1 class="text-2xl font-bold">{venue.name}</h1>
  {#if venue.address.length}
    <p class="text-sm text-slate-500 dark:text-slate-400">{venue.address.join(', ')}</p>
    <a href={mapsUrl([venue.name.replace(/\s*\(\d+\)$/, ''), ...venue.address])} target="_blank" rel="noopener" class="mt-1 inline-block text-sm text-blue-700 dark:text-blue-400">
      Vis på kort ↗
    </a>
  {/if}
  {#if venue.clubs.length}
    <p class="mt-3 text-sm">
      Bruges af
      {#each venue.clubs as club, i}{i ? ', ' : ' '}<a href="#/klub/{club.id}" class="font-medium text-blue-700 dark:text-blue-400">{club.name}</a>{/each}
    </p>
  {/if}

  <section class="mt-6">
    <h2 class="mb-3 text-lg font-bold">Kommende kampe</h2>
    <MatchList {matches} showLeague showVenue={false} />
  </section>
{:catch error}
  <ErrorBox {error} />
{/await}
