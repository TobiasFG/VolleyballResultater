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
    <h1 class="page-title mb-7">{league.title}</h1>
    <h2 class="section-title mb-1.5">Puljer</h2>
    <div class="list md:grid md:grid-cols-2 md:gap-x-12">
      {#each league.pools as pool (pool.id)}
        <a href="#/pulje/{pool.id}" class="list-row min-h-14 text-[17px] font-medium">
          <span>{pool.name}</span>
          <svg class="size-[18px] shrink-0 fill-none stroke-mute stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </a>
      {/each}
    </div>
  {:else}
    <Loading />
  {/if}
{:catch error}
  <ErrorBox {error} />
{/await}
