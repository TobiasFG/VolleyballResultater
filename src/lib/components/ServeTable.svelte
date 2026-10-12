<script>
  // Per-player serve figures for one team, from the scoresheet replay (matchlog.js serveTable).
  // The share of rallies won on own serve is drawn as a dot with its 95 % uncertainty band and the team's average,
  // so small samples look as uncertain as they are. A row opens to show the counts.
  import { SERVE_MIN } from '../matchlog.js';

  let { rows, name, side } = $props();

  let open = $state(null);

  const team = $derived(rows.reduce((a, r) => [a[0] + r.points, a[1] + r.served], [0, 0]));
  const avg = $derived(team[1] ? team[0] / team[1] : 0);
  const pct = (v) => `${Math.round(100 * v)} %`;
  // Wilson score interval.
  const band = (k, n) => {
    const z = 1.96, p = k / n, d = 1 + (z * z) / n;
    const c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
  };
  const detail = (r) => {
    const [lo, hi] = band(r.points, r.served);
    return `${r.points} af ${r.served} serv vundet · usikkerhed ${pct(lo)}–${pct(hi)} · holdets snit ${pct(avg)}`;
  };
  const color = $derived(side === 0 ? 'bg-home' : 'bg-away');
</script>

<div class="flex flex-col">
  <div class="flex items-center pb-2 text-[11px] font-semibold tracking-[0.08em] text-mute uppercase">
    <div class="flex min-w-0 flex-1 items-center gap-2 text-xs font-normal tracking-normal text-ink normal-case">
      <span class="size-2 shrink-0 rounded-full {color}"></span>
      <span class="truncate">{name}</span>
    </div>
    <div class="w-10 text-right">Serv</div>
    <div class="w-36 pl-3">Vundet i egen serv</div>
    <div class="w-11 text-right">Serie</div>
  </div>
  {#each rows as row, i}
    {@const [lo, hi] = band(row.points, row.served)}
    {@const few = row.served < SERVE_MIN}
    <div class="border-t border-line {i === rows.length - 1 ? 'border-b' : ''}">
      <button
        type="button"
        class="flex min-h-10 w-full cursor-pointer items-center text-left text-sm tabular-nums"
        title={detail(row)}
        aria-expanded={open === row.no}
        onclick={() => (open = open === row.no ? null : row.no)}
      >
        <span class="flex min-w-0 flex-1 gap-2.5">
          <span class="w-6 shrink-0 text-right text-mute">{row.no}</span>
          <span class="truncate">{row.name}</span>
        </span>
        <span class="w-10 text-right text-mute">{row.served}</span>
        <span class="flex w-36 items-center gap-2 pl-3">
          <span class="relative h-3.5 w-[5.5rem] shrink-0" aria-hidden="true">
            <span class="absolute inset-x-0 top-1.5 h-0.5 bg-line"></span>
            <span class="absolute top-[5px] h-1 rounded-full opacity-40 {color}" style="left: {100 * lo}%; width: {100 * (hi - lo)}%"></span>
            <span class="absolute top-0 bottom-0 w-px bg-mute" style="left: {100 * avg}%"></span>
            <span class="absolute top-[3px] size-2 -translate-x-1/2 rounded-full {color} {few ? 'opacity-45' : ''}" style="left: {(100 * row.points) / row.served}%"></span>
          </span>
          <span class={few ? 'text-mute' : 'font-semibold'}>{pct(row.points / row.served)}</span>
        </span>
        <span class="w-11 text-right">{row.best}</span>
      </button>
      {#if open === row.no}
        <p class="pb-2.5 pl-8.5 text-xs text-mute">{detail(row)}</p>
      {/if}
    </div>
  {/each}
</div>
