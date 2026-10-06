<script>
  import { mapsUrl } from '../format.js';

  // A venue: name (linked), address and a map link. `label` is the small heading above it.
  let { label = '', venue, address = [] } = $props();
</script>

<div class="flex flex-col gap-1.5">
  {#if label}<div class="section-title">{label}</div>{/if}
  {#if venue?.id}
    <a href="#/spillested/{venue.id}" class="text-lg font-semibold tracking-[-0.01em]">{venue.name}</a>
  {:else}
    <span class="text-lg font-semibold tracking-[-0.01em]">{venue?.name}</span>
  {/if}
  {#if address.length}
    <div class="text-sm text-mute">{address.join(', ')}</div>
    <a class="text-link text-sm font-semibold" href={mapsUrl([venue.name.replace(/\s*\(\d+\)$/, ''), ...address])} target="_blank" rel="noopener">Vis på kort ↗</a>
  {/if}
</div>
