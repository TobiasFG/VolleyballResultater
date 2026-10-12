<script>
  import { tick } from 'svelte';
  import { buildLog, listRows, liberoCount, SERVE_MIN } from '../matchlog.js';
  import LeadChart from './LeadChart.svelte';
  import ServeTable from './ServeTable.svelte';
  import Participation from './Participation.svelte';
  import SetterRotations from './SetterRotations.svelte';

  // sheet: the parsed scoresheet once it has arrived (null before, or when there is none); sheetStatus tracks the fetch.
  let { m, sheet = null, sheetStatus = 'none' } = $props();

  // The Rotationer section is switched off for now; set to true to show it again.
  const SHOW_ROTATIONS = false;

  const names = $derived([m.home?.name ?? 'Hjemme', m.away?.name ?? 'Ude']);
  const log = $derived(buildLog(m.events, names, sheet));
  const firstKnown = $derived(log.sets.every((s) => s.first !== undefined));
  const charted = $derived(log.sets.filter((s) => s.rallies.length > 1));
  const listed = $derived(log.sets.slice().reverse());
  const newest = $derived(log.sets.at(-1)?.n);
  const liberos = $derived(liberoCount(log.sets));

  const columns = $derived([log.stats.total, ...log.stats.perSet]);
  const heads = $derived(['Kamp', ...log.sets.map((s) => s.n)]);

  const items = $derived(log.sets.flatMap((s) => s.items));
  const has = $derived({
    timeout: items.some((i) => i.kind === 'timeout'),
    sub: items.some((i) => i.kind === 'sub'),
    setPoint: charted.some((s) => s.setPoints.length),
    run: charted.some((s) => s.runs.length),
    deuce: charted.some((s) => s.deuceFrom),
  });

  let showLibero = $state(false);
  let selected = $state(null); // { n: set number, k: rally number }
  const open = $state({});

  const isOpen = (n) => open[n] ?? n === newest;
  const ratio = ([won, total]) => (total ? won / total : -1);
  const pct = (pair) => (pair[1] ? `${Math.round((100 * pair[0]) / pair[1])} %` : '–');
  const emphasis = (c, key, side) => {
    const mine = ratio(c[key][side]);
    const other = ratio(c[key][1 - side]);
    return mine > other ? 'font-bold' : mine < other ? 'text-mute' : '';
  };

  async function select(n, k) {
    selected = { n, k };
    open[n] = true;
    await tick();
    document.querySelector('[data-selected]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  const resultOf = (s) => {
    const [h, a] = s.score;
    const score = `${h}–${a}`;
    if (!s.finished) return `${score} (i gang)`;
    return `${score} til ${names[h > a ? 0 : 1]}${s.minutes ? ` · ${s.minutes} min` : ''}`;
  };
  const textOf = (row) => {
    const name = names[row.team];
    return row.count === 1 ? `Point til ${name}` : `${row.count} point i træk til ${name}`;
  };
</script>

{#snippet statBlock(title, key)}
  <div class="flex flex-col">
    <div class="flex items-center pb-2 text-[11px] font-semibold tracking-[0.08em] text-mute uppercase">
      <div class="flex-1">{title}</div>
      {#each heads as head}<div class="w-12 text-right">{head}</div>{/each}
    </div>
    {#each [0, 1] as side}
      <div class="flex min-h-10 items-center border-t border-line text-sm tabular-nums {side === 1 ? 'border-b' : ''}">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <span class="size-2 shrink-0 rounded-full {side === 0 ? 'bg-home' : 'bg-away'}"></span>
          <span class="truncate">{names[side]}</span>
        </div>
        {#each columns as c}<div class="w-12 text-right {emphasis(c, key, side)}">{pct(c[key][side])}</div>{/each}
      </div>
    {/each}
  </div>
{/snippet}

<div class="flex flex-col gap-9">
  {#if sheetStatus === 'loading'}
    <p class="text-xs text-mute" role="status">Henter kampskema for servestatistik …</p>
  {:else if sheetStatus === 'failed'}
    <p class="text-xs text-mute" role="status">Kampskemaet kunne ikke hentes, så servestatistikken vises ikke.</p>
  {/if}

  {#if charted.length}
    <div class="flex flex-col gap-3">
      <div class="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-1">
        {@render statBlock('Sideout', 'so')}
        {@render statBlock('Breakpoint', 'bp')}
      </div>
      <p class="text-xs leading-normal text-mute">
        Sideout: point vundet som modtager. Breakpoint: point vundet som server.
        {firstKnown ? 'Hvem der server først i hvert sæt, står i kampskemaet.' : 'Første rally i hvert sæt tælles ikke med.'}
      </p>
    </div>

    {#if log.serve?.some((rows) => rows.length)}
      <div class="flex flex-col gap-3.5">
        <div class="section-title">Serv</div>
        <div class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-1">
          {#each [0, 1] as side}<ServeTable rows={log.serve[side]} name={names[side]} {side} />{/each}
        </div>
        <p class="text-xs leading-normal text-mute">
          Vundet i egen serv: andel af rallies holdet vandt, mens spilleren serverede (es, men også godt forsvar og angreb).
          Bjælken er usikkerheden (95 % Wilson-interval): smallere jo flere serv ved samme andel, bredest omkring 50 %.
          Stregen er holdets snit; overlapper bjælkerne, kan forskellen være tilfældig. Tryk på
          en række for at se tallene. Serie: flest point i træk i én serveomgang. Under {SERVE_MIN} serv er nedtonet og står
          sidst.
          {#if log.sets.some((s) => s.first !== undefined && !s.rotations)}Sæt hvor kampskema og kampforløb ikke stemmer overens, er ikke talt med.{/if}
        </p>
      </div>
    {/if}

    {#if log.participation?.some((team) => team.rows.length)}
      <div class="flex flex-col gap-3.5">
        <div class="section-title">Deltagelse</div>
        <div class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-1">
          {#each [0, 1] as side}<Participation team={log.participation[side]} name={names[side]} {side} />{/each}
        </div>
        <p class="text-xs leading-normal text-mute">
          Start: sæt i startopstillingen. Ind: sæt, hvor spilleren kom ind som indskifter. På banen: andel af holdets rallies,
          også for liberoen; en spiller, liberoen står for, er ikke på banen imens.
          {#if log.participation.some((p) => p.untracked)}I sæt, hvor kampforløbet ikke stemmer med liberoens skift, tælles
            liberoen ikke med.{/if}
        </p>
      </div>
    {/if}

    {#if SHOW_ROTATIONS && log.sets.some((s) => s.rotations)}
      <div class="flex flex-col gap-3.5">
        <div class="section-title">Rotationer</div>
        <SetterRotations sets={log.sets} {names} teams={[m.home, m.away]} participation={log.participation} />
      </div>
    {/if}

    <div class="flex flex-col gap-3.5">
      <div class="section-title">Sætforløb</div>
      <div class="flex flex-wrap items-center gap-x-4.5 gap-y-2 text-xs text-mute">
        <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-home"></span>{names[0]} (over stregen)</span>
        <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-away"></span>{names[1]} (under)</span>
        {#if has.timeout}
          <span class="flex items-center gap-1.5"><svg class="size-3" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4" class="fill-mute" /></svg>Time-out</span>
        {/if}
        {#if has.sub}
          <span class="flex items-center gap-1.5"><svg class="size-3" viewBox="0 0 12 12" aria-hidden="true"><rect x="5" y="2" width="2" height="8" rx="1" class="fill-mute" /></svg>Udskiftning</span>
        {/if}
        {#if has.setPoint}
          <span class="flex items-center gap-1.5"><svg class="size-3" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="3.5" stroke-width="2" class="fill-bg stroke-mute" /></svg>Sætbold</span>
        {/if}
        {#if has.run}
          <span class="flex items-center gap-1.5"><svg class="h-3 w-4" viewBox="0 0 16 12" aria-hidden="true"><path d="M2 6H14" stroke-width="4" stroke-linecap="round" class="stroke-mute" /></svg>Serie på 5+</span>
        {/if}
        {#if has.deuce}
          <span class="flex items-center gap-1.5"><span class="h-3 w-4 rounded-[3px] bg-line"></span>Forlænget sæt</span>
        {/if}
      </div>
      <div class="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
        {#each charted as set (set.n)}
          <LeadChart {set} maxLead={log.maxLead} {names} selected={selected?.n === set.n ? selected.k : null} onselect={(k) => select(set.n, k)} />
        {/each}
      </div>
    </div>
  {/if}


  <div class="flex flex-col">
    {#if liberos}
      <div class="flex min-h-11 items-center border-t border-line">
        <button type="button" onclick={() => (showLibero = !showLibero)} class="min-h-11 cursor-pointer text-sm font-semibold underline underline-offset-[3px]">
          {showLibero ? 'Skjul liberoskift' : `Vis liberoskift (${liberos})`}
        </button>
      </div>
    {/if}
    {#each listed as set (set.n)}
      <details open={isOpen(set.n)} ontoggle={(e) => (open[set.n] = e.currentTarget.open)} class="group">
        <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 border-t border-line text-[15px] [&::-webkit-details-marker]:hidden">
          <span><span class="font-semibold">{set.n}. sæt</span> <span class="text-sm tabular-nums text-mute">· {resultOf(set)}</span></span>
          <svg class="size-[18px] shrink-0 fill-none stroke-mute stroke-[1.8] transition-transform group-open:rotate-180" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </summary>
        <ol class="text-sm tabular-nums">
          {#each listRows(set, showLibero) as row}
            {@const picked = selected?.n === set.n && row.kind === 'point' && selected.k >= row.from && selected.k <= row.to}
            <li class="flex gap-4 border-t border-line py-2.5 {picked ? 'bg-ink/[0.07]' : ''}" data-selected={picked ? '' : undefined}>
              <span class="w-14 shrink-0 text-mute">{row.score}</span>
              {#if row.kind === 'point'}
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span class="flex items-center gap-2"><span class="size-2 shrink-0 rounded-full {row.team === 0 ? 'bg-home' : 'bg-away'}"></span>{textOf(row)}</span>
                  {#if row.run}<span class="rounded-full border border-line px-2 py-px text-xs font-semibold">{row.run}–0 serie</span>{/if}
                  {#if row.setPoint}<span class="rounded-full border border-line px-2 py-px text-xs font-semibold">Sætbold</span>{/if}
                </div>
              {:else if row.kind === 'timeout'}
                <div class="flex min-w-0 flex-1 gap-2.5">
                  <svg class="mt-0.5 size-4 shrink-0 fill-none stroke-ink stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>
                  <div class="flex flex-col gap-0.5">
                    <span class="font-semibold">Time-out · {names[row.team]}</span>
                    {#if row.run >= 2}<span class="text-mute">efter {row.run} point i træk til {names[1 - row.team]}</span>{/if}
                  </div>
                </div>
              {:else if row.kind === 'sub'}
                <div class="flex min-w-0 flex-1 gap-2.5">
                  <svg class="mt-0.5 size-4 shrink-0 fill-none stroke-ink stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h14l-3-3M20 16H6l3 3" /></svg>
                  <div class="flex flex-col gap-0.5">
                    <span class="font-semibold">Udskiftning · {names[row.team]}</span>
                    <span class="text-mute">Ind: {row.who} · Ud: {row.other}</span>
                  </div>
                </div>
              {:else if row.kind === 'libero'}
                <div class="flex min-w-0 flex-1 flex-col gap-0.5 text-mute">
                  <span>{row.dir ? `Libero ${row.dir}` : 'Liberoskift'} · {names[row.team]}</span>
                  {#if row.dir === 'ind'}<span>{row.who} for {row.other}</span>{:else if row.dir}<span>{row.who} ud, {row.other} ind</span>{/if}
                </div>
              {:else}
                <span class="min-w-0 flex-1 text-mute">{row.text}</span>
              {/if}
            </li>
          {/each}
        </ol>
      </details>
    {/each}
    <div class="border-t border-line"></div>
  </div>
</div>
