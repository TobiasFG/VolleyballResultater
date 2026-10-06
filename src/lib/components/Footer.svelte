<script>
  import { theme, cycleTheme } from '../theme.svelte.js';

  const label = { auto: 'system', light: 'lys', dark: 'mørk' };
  const icon = 'size-5 fill-none stroke-current stroke-[1.8]';
</script>

<footer class="relative mt-auto pt-10 pb-7 text-center text-xs leading-normal text-mute">
  <a href="#/indstillinger" aria-label="Indstillinger" class="absolute bottom-3.5 -left-3 grid size-11 place-items-center">
    <svg class={icon} viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      />
    </svg>
  </a>
  <p class="px-10">
    Data fra <a class="text-link" href="https://resultater.volleyball.dk/tms/Turneringer-og-resultater/Soegning.aspx">resultater.volleyball.dk</a> ·
    Uofficiel visning
  </p>
  <button
    onclick={cycleTheme}
    aria-label="Tema: {label[theme.mode]}"
    class="absolute -right-3 bottom-3.5 grid size-11 cursor-pointer place-items-center"
  >
    <svg class={icon} viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {#if theme.mode === 'auto'}
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      {:else if theme.mode === 'light'}
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      {:else}
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
      {/if}
    </svg>
  </button>
</footer>
