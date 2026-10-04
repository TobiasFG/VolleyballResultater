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

  let clubQuery = $state('');
  let matchNumber = $state('');
  let matchMessage = $state('');

  function findClub(e) {
    e.preventDefault();
    if (clubQuery.trim()) location.hash = '#/soeg/klub/' + encodeURIComponent(clubQuery.trim());
  }

  async function findMatch(e) {
    e.preventDefault();
    matchMessage = 'Søger…';
    try {
      const id = parseMatchSearch((await search({ type: 'match', q: matchNumber.trim() })).doc);
      if (id) location.hash = '#/kamp/' + id;
      else matchMessage = 'Ingen kamp med det nummer';
    } catch (err) {
      matchMessage = err.message;
    }
  }

  const selects = [
    ['season', 'Sæson', 'seasons'],
    ['district', 'Forbund / kreds', 'districts'],
    ['gender', 'Køn', 'genders'],
    ['division', 'Alder', 'divisions'],
  ];
</script>

<div class="space-y-8">
  {#if favorites.length}
    <section>
      <h2 class="section-title">Mine hold</h2>
      <div class="space-y-3">
        {#each favorites as fav (fav.id)}
          <FavoriteCard {fav} />
        {/each}
      </div>
    </section>
  {:else}
    <p class="card p-4 text-sm text-slate-600 dark:text-slate-300">
      Find dit hold herunder og tryk på ☆ for at få dets næste kamp og seneste resultat vist her.
    </p>
  {/if}

  <section class="space-y-3">
    <h2 class="section-title">Søg</h2>
    <form class="flex gap-2" onsubmit={findClub}>
      <input class="field" type="search" placeholder="Klubnavn, fx Gentofte" bind:value={clubQuery} enterkeyhint="search" />
      <button class="btn w-28 shrink-0">Søg klub</button>
    </form>
    <form class="flex gap-2" onsubmit={findMatch}>
      <input class="field" inputmode="numeric" pattern="[0-9]*" placeholder="Kampnummer" bind:value={matchNumber} enterkeyhint="search" />
      <button class="btn w-28 shrink-0" disabled={!matchNumber.trim()}>Find kamp</button>
    </form>
    {#if matchMessage}<p class="px-1 text-sm text-slate-500">{matchMessage}</p>{/if}
  </section>

  <section>
    <h2 class="section-title">Find række</h2>
    {#await options}
      <Loading />
    {:then opts}
      <div class="grid grid-cols-2 gap-2">
        {#each selects as [key, label, list]}
          <label class="block">
            <span class="mb-1 block px-1 text-xs text-slate-500 dark:text-slate-400">{label}</span>
            <select class="field" bind:value={filter[key]} onchange={() => (leagues = findLeagues())}>
              {#each opts[list] as o}
                <option value={o.value}>{o.label}</option>
              {/each}
            </select>
          </label>
        {/each}
      </div>
    {:catch error}
      <ErrorBox {error} />
    {/await}

    <div class="mt-3">
      {#await leagues}
        <Loading />
      {:then rows}
        {#if rows.length}
          <div class="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
            {#each rows as row (row.id)}
              <a href="#/raekke/{row.id}" class="row-link">
                <div class="min-w-0 flex-1">
                  <div class="font-medium">{row.name}</div>
                  {#if row.note}<div class="text-xs text-slate-500 dark:text-slate-400">{row.note}</div>{/if}
                </div>
                <svg class="size-5 shrink-0 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" /></svg>
              </a>
            {/each}
          </div>
        {:else}
          <p class="card p-4 text-center text-slate-500">Ingen rækker fundet</p>
        {/if}
      {:catch error}
        <ErrorBox {error} />
      {/await}
    </div>
  </section>
</div>
