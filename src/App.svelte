<script>
  import { route, goBack } from './lib/router.svelte.js';
  import Home from './lib/views/Home.svelte';
  import League from './lib/views/League.svelte';
  import Pool from './lib/views/Pool.svelte';
  import Team from './lib/views/Team.svelte';
  import Match from './lib/views/Match.svelte';
  import Club from './lib/views/Club.svelte';
  import Venue from './lib/views/Venue.svelte';
  import ClubSearch from './lib/views/ClubSearch.svelte';

  const routes = [
    [/^\/$/, Home],
    [/^\/raekke\/(\d+)$/, League],
    [/^\/pulje\/(\d+)(?:\/(stilling|kampe))?$/, Pool],
    [/^\/hold\/(\d+)$/, Team],
    [/^\/kamp\/(\d+)$/, Match],
    [/^\/klub\/(\d+)$/, Club],
    [/^\/spillested\/(\d+)$/, Venue],
    [/^\/soeg\/klub\/(.+)$/, ClubSearch],
  ];

  const current = $derived(
    routes.map(([re, view]) => ({ m: route.path.match(re), view })).find((r) => r.m) ?? { m: null, view: null },
  );
</script>

<header
  class="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
>
  <div class="mx-auto flex h-14 max-w-2xl items-center gap-2 px-2">
    {#if route.path !== '/'}
      <button onclick={goBack} class="grid size-10 place-items-center rounded-full active:bg-slate-200 dark:active:bg-slate-800" aria-label="Tilbage">
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
    {/if}
    <a href="#/" class="flex items-center gap-2 px-2 text-lg font-bold tracking-tight">
      <span aria-hidden="true">🏐</span> Volleyball resultater
    </a>
  </div>
</header>

<main class="mx-auto max-w-2xl px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
  {#key route.path}
    {#if current.view}
      <current.view params={current.m.slice(1)} />
    {:else}
      <p class="py-12 text-center text-slate-500">Siden findes ikke. <a class="text-blue-600" href="#/">Gå til forsiden</a></p>
    {/if}
  {/key}
</main>

<footer class="mx-auto max-w-2xl px-4 pb-8 text-center text-xs text-slate-400">
  Data fra <a class="underline" href="https://resultater.volleyball.dk/tms/Turneringer-og-resultater/Soegning.aspx">resultater.volleyball.dk</a>.
  Uofficiel visning.
</footer>
