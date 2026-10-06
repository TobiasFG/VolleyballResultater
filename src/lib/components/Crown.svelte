<script>
  // Sits on top of a leader's "1". Needs the gradients from App.svelte; position it via `class` (absolute).
  let { class: cls = '' } = $props();
</script>

<svg class="crown {cls}" viewBox="0 0 24 20" fill="url(#crownGrad)" role="img" aria-label="Førsteplads">
  <path class="cb" d="M2 17.5L1 5l6 5 5-8 5 8 6-5-1 12.5z" />
  <path class="cl" d="M3 19.5h18" fill="none" stroke-width="2" stroke-linecap="round" />
</svg>
