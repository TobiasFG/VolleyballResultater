<script>
  import { theme, setTheme } from '../theme.svelte.js';
  import { favorites, toggleFavorite } from '../favorites.svelte.js';

  const modes = [
    ['auto', 'System'],
    ['light', 'Lys'],
    ['dark', 'Mørk'],
  ];
</script>

<div class="mx-auto w-full md:max-w-[560px]">
<h1 class="mt-1 mb-9 text-[34px] leading-[1.1] font-bold tracking-[-0.02em] md:text-[38px] lg:text-[44px]">Indstillinger</h1>

<div class="flex flex-col gap-9">
  <section class="flex flex-col gap-3">
    <h2 class="section-title">Udseende</h2>
    <div class="flex gap-7 border-b border-line">
      {#each modes as [value, label]}
        <button
          class={['-mb-px cursor-pointer border-b-2 py-2.5 text-[15px]', theme.mode === value ? 'border-ink font-semibold' : 'border-transparent text-mute']}
          aria-pressed={theme.mode === value}
          onclick={() => setTheme(value)}>{label}</button
        >
      {/each}
    </div>
    <p class="text-[13px] text-mute">System følger din enheds indstilling.</p>
  </section>

  <section class="flex flex-col gap-3">
    <h2 class="section-title">Favoritter</h2>
    <div class="list">
      {#each favorites as fav (fav.id)}
        <div class="flex min-h-16 items-center gap-3 border-b border-line">
          <svg class="size-4 flex-none fill-fav stroke-fav stroke-[1.8]" viewBox="0 0 24 24" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>
          <a href="#/hold/{fav.id}" class="min-w-0 flex-1">
            <div class="truncate text-base font-medium">{fav.name}</div>
            <div class="truncate text-[13px] text-mute">{fav.poolTitle}</div>
          </a>
          <button class="text-link min-h-11 cursor-pointer px-1 text-sm text-mute" aria-label="Fjern {fav.name} fra favoritter" onclick={() => toggleFavorite(fav)}>Fjern</button>
        </div>
      {/each}
      {#if !favorites.length}
        <p class="border-b border-line py-4 text-[15px] leading-normal text-mute">Du har ingen favoritter endnu. Find et hold og tryk på stjernen.</p>
      {/if}
      <a href="#/" class="flex min-h-[52px] items-center gap-2 border-b border-line text-[15px] font-semibold">
        <svg class="size-4 fill-none stroke-ink stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Tilføj hold
      </a>
    </div>
  </section>
</div>
</div>
