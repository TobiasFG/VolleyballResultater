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

<h1 class="page-title mb-7">Klubber: “{query}”</h1>
{#await data}
  <Loading />
{:then clubs}
  {#if clubs.length}
    <div class="list md:grid md:grid-cols-2 md:gap-x-12">
      {#each clubs as club (club.id)}
        <a href="#/klub/{club.id}" class="list-row min-h-[60px]">
          <div class="min-w-0">
            <div class="text-[17px] font-medium">{club.name}</div>
            <div class="text-[13px] text-mute">{club.district}</div>
          </div>
          <svg class="size-[18px] shrink-0 fill-none stroke-mute stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </a>
      {/each}
    </div>
  {:else}
    <p class="border-y border-line py-3.5 text-[15px] text-mute">Ingen klubber fundet</p>
  {/if}
{:catch error}
  <ErrorBox {error} />
{/await}
