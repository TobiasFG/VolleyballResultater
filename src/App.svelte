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
  import Settings from './lib/views/Settings.svelte';
  import Footer from './lib/components/Footer.svelte';

  const routes = [
    [/^\/$/, Home],
    [/^\/raekke\/(\d+)$/, League],
    [/^\/pulje\/(\d+)(?:\/(stilling|kampe))?$/, Pool],
    [/^\/hold\/(\d+)$/, Team],
    [/^\/kamp\/(\d+)$/, Match],
    [/^\/klub\/(\d+)$/, Club],
    [/^\/spillested\/(\d+)$/, Venue],
    [/^\/soeg\/klub\/(.+)$/, ClubSearch],
    [/^\/indstillinger$/, Settings],
  ];

  const current = $derived(
    routes.map(([re, view]) => ({ m: route.path.match(re), view })).find((r) => r.m) ?? { m: null, view: null },
  );
</script>

<!-- Gradients shared by every crown (see Crown.svelte). -->
<svg width="0" height="0" class="absolute" aria-hidden="true">
  <defs>
    <linearGradient id="crownGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" style="stop-color: var(--gold-b)" />
      <stop offset="1" style="stop-color: var(--gold-a)" />
    </linearGradient>
    <linearGradient id="crownShine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="60" y2="0">
      <stop offset="0" style="stop-color: var(--gold-a)" />
      <stop offset="0.38" style="stop-color: var(--gold-a)" />
      <stop offset="0.5" style="stop-color: var(--gold-b)" />
      <stop offset="0.62" style="stop-color: var(--gold-a)" />
      <stop offset="1" style="stop-color: var(--gold-a)" />
      <animateTransform attributeName="gradientTransform" type="translate" from="-42 0" to="6 0" dur="3.2s" repeatCount="indefinite" />
    </linearGradient>
  </defs>
</svg>

<main class="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col px-6 pt-5 md:px-14 md:pt-6 lg:px-20">
  {#if route.path !== '/'}
    <button onclick={goBack} class="-ml-1.5 mb-5 flex min-h-11 w-fit cursor-pointer items-center gap-1 text-sm text-mute">
      <svg class="size-5 fill-none stroke-mute stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      Tilbage
    </button>
  {/if}
  {#key route.path}
    {#if current.view}
      <current.view params={current.m.slice(1)} />
    {:else}
      <p class="py-12 text-center text-mute">Siden findes ikke. <a class="text-link text-ink" href="#/">Gå til forsiden</a></p>
    {/if}
  {/key}
  <Footer />
</main>
