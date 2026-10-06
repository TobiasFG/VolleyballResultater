<script>
  import { page, search } from '../api.js';
  import { parseSearchOptions, parseRowList, parseMatchSearch } from '../parse.js';
  import { favorites } from '../favorites.svelte.js';
  import FavoriteCard from '../components/FavoriteCard.svelte';
  import Loading from '../components/Loading.svelte';
  import ErrorBox from '../components/ErrorBox.svelte';

  const FILTER_KEY = 'leagueFilter';
  const DEFAULT_FILTER = { season: '0', district: '1', gender: '1', division: '2' };

  function loadFilter() {
    try {
      return { ...DEFAULT_FILTER, ...JSON.parse(localStorage.getItem(FILTER_KEY)) };
    } catch {
      return { ...DEFAULT_FILTER };
    }
  }

  let filter = $state(loadFilter());
  const options = page('Soegning.aspx').then(({ doc }) => parseSearchOptions(doc));

  let leagues = $state(findLeagues());
  function findLeagues() {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
    } catch {
      // Not remembered across visits, which is fine.
    }
    return search({ type: 'rows', ...filter }).then(({ doc }) => parseRowList(doc));
  }

  // One search field: a number looks up that match number, anything else searches clubs by name.
  let query = $state('');
  let message = $state('');
  async function find(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (!/^\d+$/.test(q)) {
      location.hash = '#/soeg/klub/' + encodeURIComponent(q);
      return;
    }
    message = 'Søger…';
    try {
      const id = parseMatchSearch((await search({ type: 'match', q })).doc);
      if (id) location.hash = '#/kamp/' + id;
      else message = 'Ingen kamp med det nummer';
    } catch (err) {
      message = err.message;
    }
  }

  const selects = [
    ['season', 'Sæson', 'seasons'],
    ['district', 'Forbund / kreds', 'districts'],
    ['gender', 'Køn', 'genders'],
    ['division', 'Alder', 'divisions'],
  ];
</script>

<div class="flex flex-col gap-9 pt-6 lg:grid lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-x-16 lg:pt-10 xl:gap-x-28">
  <div class="flex flex-col gap-9">
    <h1 class="text-[34px] leading-[1.1] font-bold tracking-[-0.02em] md:text-[38px] lg:text-[44px]">Favoritter</h1>

    {#if favorites.length}
      <div class="flex flex-col md:grid md:grid-cols-3 md:gap-x-8 lg:flex">
        {#each favorites as fav (fav.id)}
          <FavoriteCard {fav} />
        {/each}
      </div>
    {:else}
      <p class="-mt-3 text-base leading-relaxed text-mute">
        Find dit hold herunder og tryk på
        <svg class="inline size-4 align-[-2px] fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24" stroke-linejoin="round" role="img" aria-label="stjerne"
          ><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg
        >
        for at få dets næste kamp og seneste resultat vist her.
      </p>
    {/if}
  </div>

  <div class="flex flex-col gap-9 lg:gap-11 lg:pt-3">
    <form class="flex flex-col gap-3" onsubmit={find}>
    <div class="flex items-center gap-3 border-b-[1.5px] border-ink pb-2.5">
      <svg class="size-5 flex-none fill-none stroke-ink stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
      </svg>
      <input
        class="min-w-0 flex-1 bg-transparent py-1 text-base"
        type="search"
        aria-label="Klub eller kampnummer"
        placeholder="Søg klub eller kampnummer"
        enterkeyhint="search"
        bind:value={query}
      />
      <button class="cursor-pointer text-sm font-semibold">Søg</button>
    </div>
    <p class="text-xs text-mute">{message || 'Et tal slår kampnummeret op, alt andet søger på klubnavn.'}</p>
  </form>

  <section class="flex flex-col gap-[18px]">
    <h2 class="text-xl font-bold tracking-[-0.01em]">Find række</h2>
    {#await options}
      <Loading />
    {:then opts}
      <div class="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4 lg:grid-cols-2">
        {#each selects as [key, label, list]}
          <label class="relative block">
            <span class="block text-xs text-mute">{label}</span>
            <select class="field-line" bind:value={filter[key]} onchange={() => (leagues = findLeagues())}>
              {#each opts[list] as o}
                <option value={o.value}>{o.label}</option>
              {/each}
            </select>
            <svg class="pointer-events-none absolute right-0 bottom-[9px] size-4 fill-none stroke-mute stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </label>
        {/each}
      </div>
    {:catch error}
      <ErrorBox {error} />
    {/await}
    {#await leagues}
      <Loading />
    {:then rows}
      {#if rows.length}
        <div class="list md:grid md:grid-cols-2 md:gap-x-12 lg:grid-cols-1">
          {#each rows as row (row.id)}
            <a href="#/raekke/{row.id}" class="list-row">
              <div class="min-w-0">
                <div class="text-base font-medium">{row.name}</div>
                {#if row.note}<div class="text-xs text-mute">{row.note}</div>{/if}
              </div>
              <svg class="size-[18px] shrink-0 fill-none stroke-mute stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </a>
          {/each}
        </div>
      {:else}
        <p class="border-y border-line py-3.5 text-[15px] text-mute">Ingen rækker fundet</p>
      {/if}
    {:catch error}
      <ErrorBox {error} />
    {/await}
  </section>
  </div>
</div>
