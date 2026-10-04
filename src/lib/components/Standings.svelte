<script>
  import { isFavorite } from '../favorites.svelte.js';

  let { table, team = null } = $props();
</script>

<div class="card overflow-hidden">
  <table class="w-full text-sm tabular-nums">
    <thead class="text-xs text-slate-500 dark:text-slate-400">
      <tr class="border-b border-slate-100 dark:border-slate-800">
        <th class="w-8 py-2 pl-3 text-left font-medium">#</th>
        <th class="py-2 text-left font-medium">Hold</th>
        <th class="w-7 py-2 text-center font-medium" title="Kampe">K</th>
        <th class="w-7 py-2 text-center font-medium" title="Vundne">V</th>
        <th class="w-7 py-2 text-center font-medium" title="Tabte">T</th>
        <th class="w-14 py-2 text-center font-medium">Sæt</th>
        <th class="hidden w-24 py-2 text-center font-medium sm:table-cell">Bolde</th>
        <th class="w-9 py-2 pr-3 text-right font-medium" title="Point">P</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
      {#each table.rows as row}
        {@const mine = row.team?.id && (row.team.id === team || isFavorite(row.team.id))}
        <tr class={[mine && 'bg-blue-50 dark:bg-blue-950/60']}>
          <td class="py-2.5 pl-3 text-slate-500 dark:text-slate-400">{row.pos}</td>
          <td class="max-w-0 py-2.5">
            {#if row.team?.id}
              <a href="#/hold/{row.team.id}" class="block truncate font-medium">{row.team.name}</a>
            {:else}
              <span class="block truncate">{row.team?.name}</span>
            {/if}
          </td>
          <td class="py-2.5 text-center">{row.played}</td>
          <td class="py-2.5 text-center">{row.won}</td>
          <td class="py-2.5 text-center">{row.lost}</td>
          <td class="py-2.5 text-center text-slate-600 dark:text-slate-300">{row.setsWon}-{row.setsLost}</td>
          <td class="hidden py-2.5 text-center text-slate-600 sm:table-cell dark:text-slate-300">{row.balls}</td>
          <td class="py-2.5 pr-3 text-right font-semibold">{row.points}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
