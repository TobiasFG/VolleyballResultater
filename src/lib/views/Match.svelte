<script>
  import { page } from '../api.js';
  import { parseMatch } from '../parse.js';
  import { formatDay, formatTime } from '../format.js';
  import { tone, toneClass } from '../results.js';
  import TeamName from '../components/TeamName.svelte';
  import VenueBlock from '../components/VenueBlock.svelte';
  import Loading from '../components/Loading.svelte';
  import ErrorBox from '../components/ErrorBox.svelte';

  let { params } = $props();
  // svelte-ignore state_referenced_locally -- views are remounted on every route change
  const [id] = params;

  const data = page(`Kamp-Information.aspx?KampId=${id}`).then(({ doc }) => parseMatch(doc));

  const won = (score, side) => (side === 0 ? score[0] > score[1] : score[1] > score[0]);

  // The winner is always bold; a favourite's own result is coloured (see results.js).
  const scoreClass = (m, side) => {
    const colour = toneClass(tone(m.home, m.away, m.score, side));
    return [won(m.score, side) && 'font-bold', colour || (!won(m.score, side) && 'text-mute')];
  };
  const setClass = (m, set, side) => {
    const score = [+set.home, +set.away];
    const colour = toneClass(tone(m.home, m.away, score, side));
    return [won(score, side) && 'font-bold', colour || (!won(score, side) && 'text-mute')];
  };

  const facts = (m) =>
    [
      ['Bane', m.court],
      ['Runde', m.round],
      ['Kampnummer', m.number],
      ['Kamppoint', m.matchPoints],
      ...m.referees.map((r) => [r.label, r.name]),
    ].filter(([, value]) => value);
</script>

{#await data}
  <Loading />
{:then m}
  <div class="flex flex-col gap-8 lg:grid lg:grid-cols-[7fr_5fr] lg:items-start lg:gap-x-16 lg:gap-y-9 xl:gap-x-28">
    <div class="flex flex-col gap-5 lg:col-start-1">
      <div class="flex flex-col gap-1">
        {#if m.pool?.id}
          <a href="#/pulje/{m.pool.id}" class="text-link text-[13px] font-medium">{m.league?.name} · {m.pool.name}</a>
        {/if}
        {#if m.date}
          <p class="text-[13px] text-mute">{formatDay(m.date)} kl. {formatTime(m.date)}</p>
        {/if}
      </div>
      <div class="flex items-center justify-between gap-4">
        <div class="flex min-w-0 flex-col gap-2.5">
          {#each [m.home, m.away] as team, side}
            <a
              href={team?.id ? `#/hold/${team.id}` : null}
              class={['text-[22px] tracking-[-0.015em] md:text-[26px]', m.score ? (won(m.score, side) ? 'font-bold' : 'text-mute') : 'font-semibold']}
            >
              <TeamName {team} />
              <span class="text-xs font-normal tracking-normal text-mute">{side === 0 ? 'Hjemme' : 'Ude'}</span>
            </a>
          {/each}
        </div>
        {#if m.score}
          <div class="flex flex-col gap-1 text-right text-[52px] leading-none md:text-[56px] tracking-[-0.03em] tabular-nums">
            {#each [0, 1] as side}<div class={scoreClass(m, side)}>{m.score[side]}</div>{/each}
          </div>
        {:else}
          <div class="text-[26px] tracking-[-0.02em] text-mute">vs</div>
        {/if}
      </div>
    </div>

    {#if m.sets.length}
      <div class="flex flex-col lg:col-start-1">
        <div class="flex items-center pb-2 text-[11px] font-semibold tracking-[0.08em] text-mute uppercase">
          <div class="flex-1">Sæt</div>
          {#each m.sets as _, i}<div class="w-14 text-right">{i + 1}</div>{/each}
        </div>
        {#each [[m.home, 'home', 0], [m.away, 'away', 1]] as [team, key, side]}
          <div class="flex min-h-11 items-center border-t border-line text-base tabular-nums {side === 1 ? 'border-b' : ''}">
            <div class="min-w-0 flex-1 truncate pr-2 text-sm">{team?.name}</div>
            {#each m.sets as set}
              <div class={['w-14 text-right', setClass(m, set, side)]}>{set[key]}</div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}

    {#if m.venue?.id || facts(m).length || m.roster || m.scoresheet}
      <div class="flex flex-col gap-7 md:grid md:grid-cols-2 md:gap-x-12 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:flex lg:gap-8">
        {#if m.venue?.id}
          <div class="md:col-start-1"><VenueBlock label="Spillested" venue={m.venue} address={m.address} /></div>
        {/if}
        {#if facts(m).length}
          <div class="grid grid-cols-2 gap-x-6 gap-y-5 md:col-start-2 md:row-span-2 md:row-start-1">
            {#each facts(m) as [label, value]}
              <div>
                <div class="mb-0.5 text-xs text-mute">{label}</div>
                <div class="text-base font-medium tabular-nums">{value}</div>
              </div>
            {/each}
          </div>
        {/if}
        {#if m.roster || m.scoresheet}
          <div class="flex gap-6 text-sm font-semibold md:col-start-1">
            {#each [[m.roster, 'Holdkort'], [m.scoresheet, 'Kampskema']] as [href, label]}
              {#if href}
                <a {href} target="_blank" rel="noopener" class="flex items-center gap-2">
                  <svg class="size-4 fill-none stroke-ink stroke-[1.8]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></svg>
                  {label} (PDF)
                </a>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#if m.events.length}
      <details class="group lg:col-start-1">
        <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between border-y border-line text-base font-semibold [&::-webkit-details-marker]:hidden">
          <span>Kampforløb <span class="text-sm font-normal text-mute">({m.events.length} hændelser)</span></span>
          <svg class="size-[18px] fill-none stroke-mute stroke-[1.8] transition-transform group-open:rotate-180" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </summary>
        <ol class="text-sm tabular-nums">
          {#each m.events as event}
            <li class="flex gap-4 border-b border-line py-2.5 last:border-b-0">
              <span class="w-14 shrink-0 text-mute">{event.score}</span><span>{event.text}</span>
            </li>
          {/each}
        </ol>
      </details>
    {/if}
  </div>
{:catch error}
  <ErrorBox {error} />
{/await}
