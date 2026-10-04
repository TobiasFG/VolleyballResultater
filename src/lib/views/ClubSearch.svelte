<script>
  import { search } from '../api.js';
  import { parseClubList } from '../parse.js';
  import Loading from '../components/Loading.svelte';
  import ErrorBox from '../components/ErrorBox.svelte';

  let { params } = $props();
  // svelte-ignore state_referenced_locally -- views are remounted on every route change
  const [query] = params;

  const data = search({ type: 'club', q: query }).then(({ doc }) => parseClubList(doc));
</script>

<h1 class="mb-4 text-2xl font-bold">Klubber: “{query}”</h1>
{#await data}
  <Loading />
{:then clubs}
  {#if clubs.length}
    <div class="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
      {#each clubs as club (club.id)}
        <a href="#/klub/{club.id}" class="row-link">
          <div class="min-w-0 flex-1">
            <div class="font-medium">{club.name}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">{club.district}</div>
          </div>
          <svg class="size-5 shrink-0 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" /></svg>
        </a>
      {/each}
    </div>
  {:else}
    <p class="card p-4 text-center text-slate-500">Ingen klubber fundet</p>
  {/if}
{:catch error}
  <ErrorBox {error} />
{/await}
