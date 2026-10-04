<script>
  import { page } from '../api.js';
  import { parseMatch } from '../parse.js';
  import { formatDay, formatTime, mapsUrl } from '../format.js';
  import Loading from '../components/Loading.svelte';
  import ErrorBox from '../components/ErrorBox.svelte';

  let { params } = $props();
  // svelte-ignore state_referenced_locally -- views are remounted on every route change
  const [id] = params;

  const data = page(`Kamp-Information.aspx?KampId=${id}`).then(({ doc }) => parseMatch(doc));

  const winner = (score, side) => score && (side === 0 ? score[0] > score[1] : score[1] > score[0]);
</script>

{#await data}
  <Loading />
{:then m}
  <div class="text-center">
    {#if m.pool?.id}
      <a href="#/pulje/{m.pool.id}" class="text-sm text-blue-700 dark:text-blue-400">{m.league?.name} · {m.pool.name}</a>
    {/if}
    {#if m.date}
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDay(m.date)} kl. {formatTime(m.date)}</p>
    {/if}
  </div>

  <div class="card mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5">
    {#each [m.home, m.away] as team, side}
      {#if side === 1}
        <div class="text-center text-4xl font-bold tabular-nums">
          {#if m.score}{m.score[0]}<span class="text-slate-300 dark:text-slate-600">–</span>{m.score[1]}{:else}<span class="text-xl text-slate-400">vs</span>{/if}
        </div>
      {/if}
      <a href={team?.id ? `#/hold/${team.id}` : null} class={['text-center leading-tight', winner(m.score, side) ? 'font-bold' : 'font-medium', m.score && !winner(m.score, side) && 'text-slate-500 dark:text-slate-400']}>
        {team?.name ?? '–'}
        <span class="mt-1 block text-xs font-normal text-slate-500">{side === 0 ? 'Hjemme' : 'Ude'}</span>
      </a>
    {/each}
  </div>

  {#if m.sets.length}
    <div class="card mt-3 overflow-x-auto">
      <table class="w-full text-center tabular-nums">
        <thead class="text-xs text-slate-500">
          <tr>
            <th></th>
            {#each m.sets as _, i}<th class="px-2 pt-3 pb-1 font-medium">{i + 1}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each [['home', m.home], ['away', m.away]] as [key, team]}
            <tr>
              <td class="max-w-28 truncate py-1.5 pl-4 text-left text-sm">{team?.name}</td>
              {#each m.sets as set}
                {@const other = key === 'home' ? set.away : set.home}
                <td class={['px-2 py-1.5', +set[key] > +other ? 'font-bold' : 'text-slate-500 dark:text-slate-400']}>{set[key]}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="h-2"></div>
    </div>
  {/if}

  <div class="card mt-6 divide-y divide-slate-100 text-sm dark:divide-slate-800">
    {#if m.venue?.id}
      <a href="#/spillested/{m.venue.id}" class="row-link">
        <span class="w-24 shrink-0 text-slate-500">Spillested</span>
        <span class="flex-1"><span class="font-medium">{m.venue.name}</span><br />{m.address.join(', ')}</span>
      </a>
      {#if m.address.length}
        <a href={mapsUrl([m.venue.name, ...m.address])} target="_blank" rel="noopener" class="row-link text-blue-700 dark:text-blue-400">
          <span class="w-24 shrink-0"></span><span>Vis på kort ↗</span>
        </a>
      {/if}
    {/if}
    {#each [['Bane', m.court], ['Kampnummer', m.number], ['Runde', m.round], ['Kamppoint', m.matchPoints]] as [label, value]}
      {#if value}
        <div class="flex gap-3 px-4 py-3"><span class="w-24 shrink-0 text-slate-500">{label}</span><span>{value}</span></div>
      {/if}
    {/each}
    {#each m.referees as ref}
      <div class="flex gap-3 px-4 py-3"><span class="w-24 shrink-0 text-slate-500">{ref.label}</span><span>{ref.name}</span></div>
    {/each}
    {#if m.roster}
      <a href={m.roster} target="_blank" rel="noopener" class="row-link text-blue-700 dark:text-blue-400">
        <span class="w-24 shrink-0 text-slate-500">Holdkort</span><span>Hent PDF ↗</span>
      </a>
    {/if}
    {#if m.scoresheet}
      <a href={m.scoresheet} target="_blank" rel="noopener" class="row-link text-blue-700 dark:text-blue-400">
        <span class="w-24 shrink-0 text-slate-500">Kampskema</span><span>Hent PDF ↗</span>
      </a>
    {/if}
  </div>

  {#if m.events.length}
    <details class="card mt-6 overflow-hidden">
      <summary class="cursor-pointer px-4 py-3 font-medium">Kampforløb ({m.events.length} hændelser)</summary>
      <ol class="divide-y divide-slate-100 border-t border-slate-100 text-sm dark:divide-slate-800 dark:border-slate-800">
        {#each m.events as event}
          <li class="flex gap-3 px-4 py-2">
            <span class="w-14 shrink-0 text-slate-500 tabular-nums">{event.score}</span><span>{event.text}</span>
          </li>
        {/each}
      </ol>
    </details>
  {/if}
{:catch error}
  <ErrorBox {error} />
{/await}
