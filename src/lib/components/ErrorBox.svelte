<script>
  let { error } = $props();
</script>

<div class="card p-4 text-center">
  <p class="font-medium">Noget gik galt</p>
  <p class="mt-1 text-sm text-slate-500">{error?.message ?? error}</p>
  <button class="btn mt-3" onclick={() => location.reload()}>Prøv igen</button>
</div>
