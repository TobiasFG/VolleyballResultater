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

  const FEW = 3;
  let showAll = $state(false);
</script>

{#await data}
  <Loading />
{:then [venue, matches]}
  <div class="flex flex-col gap-8 lg:grid lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-x-16 xl:gap-x-28">
    <div class="flex flex-col gap-1.5">
      <h1 class="page-title">{venue.name}</h1>
      {#if venue.address.length}
        <div class="text-sm text-mute">{venue.address.join(', ')}</div>
        <a href={mapsUrl([venue.name.replace(/\s*\(\d+\)$/, ''), ...venue.address])} target="_blank" rel="noopener" class="text-link mt-1 text-sm font-medium">Vis på kort ↗</a>
      {/if}
      {#if venue.clubs.length}
        <p class="mt-2.5 text-sm">
          Bruges af
          {#each venue.clubs as club, i}{i ? ', ' : ' '}<a href="#/klub/{club.id}" class="text-link font-semibold">{club.name}</a>{/each}
        </p>
      {/if}
    </div>

    <section>
      <h2 class="mb-2 text-xl font-bold tracking-[-0.01em]">Kommende kampe</h2>
      <MatchList matches={showAll ? matches : matches.slice(0, FEW)} showLeague showVenue={false} emphasizeFirst />
      {#if matches.length > FEW}
        <button class="more-link cursor-pointer" onclick={() => (showAll = !showAll)}>
          <svg class="size-4 fill-none stroke-ink stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={showAll ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} /></svg>
          {showAll ? 'Vis færre' : `Vis alle kommende kampe (${matches.length})`}
        </button>
      {/if}
    </section>
  </div>
{:catch error}
  <ErrorBox {error} />
{/await}
