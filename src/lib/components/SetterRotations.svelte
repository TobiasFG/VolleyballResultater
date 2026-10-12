<script>
  // Rotations counted from the setters the viewer marks (matchlog.js setterRotations). One row of H1-H6 per marked
  // setter, plus a row for rallies with no marked setter on court. The marking is remembered per team on this device.
  import { setterRotations } from '../matchlog.js';

  let { sets, names, teams, participation } = $props();

  // With few rallies the strongest and weakest rotation is noise, so it is only marked from this many.
  const MARK_MIN = 30;

  let side = $state(0);
  const key = (t) => `setters:${teams[t]?.id ?? teams[t]?.name ?? t}`;
  const load = (t) => {
    try {
      return JSON.parse(localStorage.getItem(key(t))) ?? [];
    } catch {
      return [];
    }
  };
  let marked = $state([load(0), load(1)]);
  function toggle(no) {
    const current = marked[side];
    marked[side] = no === null ? [] : current.includes(no) ? current.filter((x) => x !== no) : [...current, no];
    try {
      localStorage.setItem(key(side), JSON.stringify(marked[side]));
    } catch {
      // Storage can be unavailable (private mode); the marking then lasts until the page is left.
    }
  }

  const setters = $derived(marked[side]);
  const players = $derived(participation[side].rows.filter((r) => !r.libero && (r.started || r.subbed)));
  const nameOf = (no) => participation[side].rows.find((r) => r.no === no)?.name ?? `nr. ${no}`;
  const firstName = (no) => nameOf(no).split(' ')[0];
  const starters = $derived(new Set(players.filter((p) => p.started).map((p) => p.no)));
  const groups = $derived(setterRotations(sets, side, setters));
  const bySetter = $derived(groups.filter((g) => g.setter !== null));
  const servers = $derived(groups.filter((g) => g.setter === null).sort((a, b) => b.net - a.net));
  const noSetter = $derived(setters.length ? servers.reduce((n, g) => n + g.rallies, 0) : 0);
  const many = $derived(new Set(bySetter.map((g) => g.setter)).size > 1);
  const ranked = $derived((bySetter.length ? bySetter : servers).slice().sort((a, b) => b.net - a.net));

  const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
  const label = (g) => (g.setter === null ? `${firstName(g.server)} i serv` : `H${g.z}`);
  // The most common lineup in the rotation. A player a libero stood in for during some of its rallies is shown together
  // with the libero as one spot ("Mads/Hans"); if the libero stood in for every rally, only the libero.
  const court = (g) =>
    [...g.lineups]
      .sort((a, b) => b[1] - a[1])[0][0]
      .split(',')
      .map(Number)
      .map((no) => {
        const name = firstName(no) + (setters.includes(no) ? ' (hæver)' : starters.has(no) ? '' : ' (ind)');
        const libs = [...(g.liberoFor.get(no) ?? [])];
        if (!libs.length) return name;
        const libNames = libs.map(([l]) => firstName(l)).join('/');
        return libs.reduce((n, [, c]) => n + c, 0) >= g.rallies ? `${libNames} (libero)` : `${name}/${libNames}`;
      })
      .join(', ');

  const blocks = $derived.by(() => {
    const out = [];
    for (const no of setters) {
      const own = bySetter.filter((g) => g.setter === no);
      if (!own.length) continue;
      const total = own.reduce((n, g) => n + g.rallies, 0);
      const nets = own.map((g) => g.net);
      const mark = total >= MARK_MIN && own.length > 1;
      out.push({
        title: `${nameOf(no)} (${no})`,
        sub: `${total} rallies som hæver`,
        cols: 6,
        tiles: [1, 2, 3, 4, 5, 6].map((z) => {
          const g = own.find((x) => x.z === z);
          return { label: `H${z}`, g, best: mark && g?.net === Math.max(...nets), worst: mark && g?.net === Math.min(...nets) };
        }),
      });
    }
    if (servers.length) {
      out.push({
        title: setters.length ? 'Uden markeret hæver på banen' : '',
        sub: setters.length ? `${noSetter} rallies` : '',
        cols: 4,
        tiles: servers.map((g) => ({ label: label(g), g })),
      });
    }
    return out;
  });
</script>

<div class="flex flex-col gap-4">
  <div class="flex gap-4.5 border-b border-line" role="tablist">
    {#each [0, 1] as t}
      <button
        type="button"
        role="tab"
        aria-selected={side === t}
        onclick={() => (side = t)}
        class="-mb-px flex min-h-11 cursor-pointer items-center gap-2 border-b-2 text-sm {side === t ? 'border-ink font-semibold' : 'border-transparent text-mute'}"
      >
        <span class="size-2 rounded-full {t === 0 ? 'bg-home' : 'bg-away'}"></span>{names[t]}
      </button>
    {/each}
  </div>

  <div class="flex flex-col gap-2">
    <div class="text-[13px] font-semibold">Hvem er hæver? <span class="font-normal text-mute">Vælg gerne flere</span></div>
    <div class="flex flex-wrap gap-1.5">
      {#each [{ no: null, text: 'Ingen' }, ...players.map((p) => ({ no: p.no, text: `${firstName(p.no)} ${p.no}` }))] as chip}
        {@const on = chip.no === null ? !setters.length : setters.includes(chip.no)}
        <button
          type="button"
          aria-pressed={on}
          onclick={() => toggle(chip.no)}
          class="min-h-9 cursor-pointer rounded-full border px-3 text-[13px] {on ? 'border-ink bg-ink font-semibold text-bg' : 'border-line'}"
        >
          {chip.text}
        </button>
      {/each}
    </div>
    <p class="text-xs leading-normal text-mute">
      {#if setters.length}
        Rotationerne tælles fra den markerede hæver, der står på banen (H1 = hæveren server). Ved et dobbeltskift, hvor hæver
        og diagonal byttes, følger rotationen den nye hæver. To hævere på banen: den i bagkæden tæller. Valget huskes for holdet
        på denne enhed.
      {:else}
        Uden hæver er rotationerne navngivet efter spilleren i serveposition.
      {/if}
    </p>
  </div>

  {#if ranked.length}
    <div class="grid grid-cols-2 gap-2.5">
      {#each [[ranked[0], 'Stærkest'], [ranked.at(-1), 'Svagest']] as [g, title]}
        <div class="flex flex-col gap-1 rounded-xl border border-line p-3">
          <div class="text-[11px] font-semibold tracking-[0.08em] text-mute uppercase">{title}</div>
          <div class="flex items-baseline gap-2">
            <span class="text-[28px] font-semibold tracking-[-0.02em] tabular-nums">{signed(g.net)}</span>
            <span class="text-[17px] font-semibold text-mute">{label(g)}{many && g.setter !== null ? ` · ${firstName(g.setter)}` : ''}</span>
          </div>
          <div class="text-xs text-mute">{g.rallies} rallies</div>
          <div class="mt-1 text-xs leading-normal"><span class="text-mute">På banen: </span>{court(g)}</div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="flex flex-col gap-2">
    <div class="text-[11px] font-semibold tracking-[0.08em] text-mute uppercase">Alle rotationer</div>
    {#each blocks as block}
      <div class="flex flex-col gap-1.5">
        {#if block.title}
          <div class="flex items-baseline gap-2 text-[13px]"><span class="font-semibold">{block.title}</span><span class="text-xs text-mute">{block.sub}</span></div>
        {/if}
        <div class="grid gap-1.5 {block.cols === 6 ? 'grid-cols-6' : 'grid-cols-4'}">
          {#each block.tiles as tile}
            <div
              class="flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 tabular-nums {tile.best ? 'border-[1.5px] border-ink' : tile.worst ? 'border border-line bg-ink/[0.06]' : 'border border-line'}"
              title={tile.g ? `${tile.label}: ${signed(tile.g.net)} på ${tile.g.rallies} rallies` : 'Ingen rallies'}
            >
              <span class="max-w-full truncate text-xs font-semibold text-mute">{tile.label}</span>
              <span class="text-[17px] font-semibold {tile.g?.net < 0 ? 'text-mute' : ''}">{tile.g ? signed(tile.g.net) : '–'}</span>
              <span class="text-[11px] text-mute">{tile.g?.rallies ?? ''}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
    <p class="text-xs leading-normal text-mute">
      Pointforskel og antal rallies pr. rotation, én række pr. hæver. Mørk ramme: hæverens stærkeste rotation, grå: svageste
      (fra {MARK_MIN} rallies). ”På banen” er den hyppigste opstilling i rotationen; udskiftninger følges. Tallene er holdets
      resultat i rotationen, ikke hæverens præstation. En spiller, liberoen stod for i en del af rotationen, vises sammen med
      liberoen (”Mads/Hans”).
      {#if noSetter}{noSetter} rallies uden markeret hæver på banen er navngivet efter serveren.{/if}
    </p>
  </div>
</div>
