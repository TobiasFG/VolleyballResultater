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

  const data = Promise.all([
    page(`Pulje-Stilling.aspx?PuljeId=${id}`).then(({ doc }) => parseStandings(doc)),
    page(`Pulje-Komplet-Kampprogram.aspx?PuljeId=${id}`).then(({ doc }) => parseProgram(doc)),
  ]).then(([standings, program]) => {
    // Cup rounds have no standings; open on the matches instead.
    tab ??= standings.tables.length ? 'stilling' : 'kampe';
    return { standings, program, matches: program.matches.toSorted(byDate) };
  });

  function select(next) {
    tab = next;
    history.replaceState(null, '', `#/pulje/${id}/${next}`);
  }
</script>

{#await data}
  <Loading />
{:then { standings, program, matches }}
  <h1 class="text-2xl font-bold">{program.title || standings.title}</h1>
  {#if program.note || standings.note}
    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{program.note || standings.note}</p>
  {/if}

  <div class="sticky top-14 z-[5] -mx-4 mt-4 mb-4 bg-slate-50/90 px-4 py-2 backdrop-blur dark:bg-slate-950/90">
    <div class="grid grid-cols-2 rounded-xl bg-slate-200 p-1 text-sm font-medium dark:bg-slate-800">
      {#each [['stilling', 'Stilling'], ['kampe', 'Kampe']] as [key, label]}
        <button
          class={['rounded-lg py-2', tab === key ? 'bg-white shadow-sm dark:bg-slate-950' : 'text-slate-600 dark:text-slate-400']}
          onclick={() => select(key)}>{label}</button
        >
      {/each}
    </div>
  </div>

  {#if tab === 'stilling'}
    {#if standings.tables.length}
      <div class="space-y-4">
        {#each standings.tables as table}
          <div>
            {#if standings.tables.length > 1 && table.title}<h2 class="section-title">{table.title}</h2>{/if}
            <Standings {table} />
          </div>
        {/each}
        <p class="px-1 text-xs text-slate-500">K = kampe, V = vundne, T = tabte, P = point</p>
      </div>
    {:else}
      <p class="card p-4 text-center text-slate-500">Ingen stilling for denne pulje</p>
    {/if}
  {:else}
    {#if program.calendar}
      <a href={program.calendar} class="card mb-4 flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-700 dark:text-blue-400">
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
        Abonnér på kampprogrammet i din kalender
      </a>
    {/if}
    <MatchList {matches} scrollToNext />
  {/if}
{:catch error}
  <ErrorBox {error} />
{/await}
