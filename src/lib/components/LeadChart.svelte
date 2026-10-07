<script>
  // The lead (home minus away) after every rally of one set: home above the zero line, away below.
  // Markers: timeouts (circle on the calling team's edge), substitutions (tick), set point (ring),
  // runs of 5+ (thicker line) and the extended part of the set (shaded band).
  let { set, maxLead, names, selected = null, onselect } = $props();

  const H = 112;
  const MID = 56;
  const PAD = 6;
  const ink = ['stroke-home', 'stroke-away'];
  const fillOf = ['fill-home', 'fill-away'];

  let w = $state(0);
  const n = $derived(set.rallies.length);
  const x = (k) => PAD + (k / n) * (w - 2 * PAD);
  const lead = (k) => (k === 0 ? 0 : set.rallies[k - 1].h - set.rallies[k - 1].a);
  const y = (k) => MID - lead(k) * (34 / maxLead);
  const pt = (k) => `${Math.round(x(k) * 10) / 10} ${Math.round(y(k) * 10) / 10}`;

  const line = $derived.by(() => {
    let d = 'M' + pt(0);
    for (let k = 1; k <= n; k++) d += ' L' + pt(k);
    return d;
  });
  const area = $derived(`${line} L${x(n)} ${MID} L${x(0)} ${MID} Z`);
  const runPath = (r) => {
    let d = 'M' + pt(r.startK - 1);
    for (let k = r.startK; k <= r.endK; k++) d += ' L' + pt(k);
    return d;
  };

  const timeouts = $derived(set.items.filter((i) => i.kind === 'timeout'));
  const subs = $derived(set.items.filter((i) => i.kind === 'sub'));

  const sel = $derived(selected === null ? null : set.rallies[selected - 1]);
  const headline = $derived.by(() => {
    if (!sel) return `${set.score[0]}–${set.score[1]}`;
    const diff = sel.h - sel.a;
    const who = diff === 0 ? 'Lige' : `${names[diff > 0 ? 0 : 1]} +${Math.abs(diff)}`;
    return `${who} · ${sel.h}–${sel.a}`;
  });

  const summary = $derived.by(() => {
    const best = (side) => Math.max(0, ...set.rallies.map((r) => (side === 0 ? r.h - r.a : r.a - r.h)));
    return `${set.n}. sæt ${set.score[0]}–${set.score[1]}. Største ledelse: ${names[0]} ${best(0)}, ${names[1]} ${best(1)}. Vælg et punkt for at se det i listen.`;
  });

  function pick(e) {
    const box = e.currentTarget.getBoundingClientRect();
    const k = Math.round(((e.clientX - box.left - PAD) / (box.width - 2 * PAD)) * n);
    onselect(Math.min(Math.max(k, 1), n));
  }
  function step(e) {
    const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    onselect(Math.min(Math.max((selected ?? (dir > 0 ? 0 : n + 1)) + dir, 1), n));
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-baseline justify-between gap-3 text-[13px]">
    <span class="font-semibold">{set.n}. sæt</span>
    <span class="truncate tabular-nums text-mute">{headline}</span>
  </div>
  <button type="button" class="block w-full cursor-pointer" aria-label={summary} bind:clientWidth={w} onclick={pick} onkeydown={step}>
    {#if w > 0}
      <svg width={w} height={H} viewBox="0 0 {w} {H}" class="block" aria-hidden="true">
        <defs>
          <clipPath id="up-{set.n}"><rect x="0" y="0" width={w} height={MID} /></clipPath>
          <clipPath id="dn-{set.n}"><rect x="0" y={MID} width={w} height={H - MID} /></clipPath>
        </defs>
        {#if set.deuceFrom}
          <rect x={x(set.deuceFrom - 1)} y="0" width={x(n) - x(set.deuceFrom - 1) + 2} height={H} rx="4" class="fill-line opacity-70" />
        {/if}
        <line x1="0" x2={w} y1={MID} y2={MID} class="stroke-line" />
        <path d={area} clip-path="url(#up-{set.n})" class="fill-home" fill-opacity="0.16" />
        <path d={area} clip-path="url(#dn-{set.n})" class="fill-away" fill-opacity="0.16" />
        <path d={line} clip-path="url(#up-{set.n})" class="stroke-home" fill="none" stroke-width="2" stroke-linejoin="round" />
        <path d={line} clip-path="url(#dn-{set.n})" class="stroke-away" fill="none" stroke-width="2" stroke-linejoin="round" />
        {#each set.runs as r}
          <path d={runPath(r)} class={ink[r.team]} fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        {/each}
        {#each subs as s}
          <rect x={x(s.k) - 1} y={s.team === 0 ? 13 : 92} width="2" height="7" rx="1" class={fillOf[s.team]} />
        {/each}
        {#each set.setPoints as p}
          <circle cx={x(p.k)} cy={y(p.k)} r="4" stroke-width="2" class="fill-bg {ink[p.team]}" />
        {/each}
        {#each timeouts as t}
          <circle cx={x(t.k)} cy={t.team === 0 ? 7 : 105} r="4" stroke-width="2" class="stroke-bg {fillOf[t.team]}" />
        {/each}
        {#if sel}
          <line x1={x(selected)} x2={x(selected)} y1="0" y2={H} class="stroke-ink" stroke-opacity="0.4" />
          <circle cx={x(selected)} cy={y(selected)} r="4" stroke-width="2" class="fill-ink stroke-bg" />
        {/if}
      </svg>
    {:else}
      <div style="height: {H}px"></div>
    {/if}
  </button>
</div>
