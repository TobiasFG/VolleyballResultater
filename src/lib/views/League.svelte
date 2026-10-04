<script>
  import { page } from '../api.js';
  import { parsePoolList } from '../parse.js';
  import Loading from '../components/Loading.svelte';
  import ErrorBox from '../components/ErrorBox.svelte';

  let { params } = $props();
  // svelte-ignore state_referenced_locally -- views are remounted on every route change
  const [id] = params;

  // A league with a single group redirects straight to that group; follow it inside the app.
  const data = page(`Pulje-Oversigt.aspx?RaekkeId=${id}`).then(({ doc, finalUrl }) => {
    const poolId = finalUrl.match(/PuljeId=(\d+)/i)?.[1];
    if (poolId) {
      location.replace(`#/pulje/${poolId}`);
      return null;
    }
    return parsePoolList(doc);
  });
</script>

{#await data}
  <Loading />
{:then league}
  {#if league}
    <h1 class="mb-4 text-2xl font-bold">{league.title}</h1>
    <h2 class="section-title">Puljer</h2>
    <div class="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
      {#each league.pools as pool (pool.id)}
        <a href="#/pulje/{pool.id}" class="row-link font-medium">
          <span class="flex-1">{pool.name}</span>
          <svg class="size-5 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" /></svg>
        </a>
      {/each}
    </div>
  {:else}
    <Loading />
  {/if}
{:catch error}
  <ErrorBox {error} />
{/await}
