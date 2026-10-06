<script>
  let { error } = $props();
</script>

<div class="flex items-start gap-3 pt-2">
  <svg class="mt-0.5 size-[22px] flex-none fill-none stroke-loss stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </svg>
  <div>
    <p class="text-[17px] font-semibold">Kunne ikke hente data</p>
    <p class="mt-1 text-sm leading-normal text-mute">{error?.message ?? error}</p>
    <button class="text-link mt-3.5 cursor-pointer text-sm font-semibold" onclick={() => location.reload()}>Prøv igen</button>
  </div>
</div>
