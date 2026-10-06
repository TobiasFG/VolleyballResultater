<script>
  import Crown from './Crown.svelte';
  import TeamName from './TeamName.svelte';

  let { table } = $props();
</script>

<table class="w-full text-sm tabular-nums md:text-[15px]">
  <thead class="text-[11px] font-semibold tracking-[0.06em] text-mute uppercase">
    <tr>
      <th class="w-[22px] pb-2 text-left font-semibold md:w-9 lg:w-10">#</th>
      <th class="pb-2 text-left font-semibold">Hold</th>
      <th class="w-[22px] pb-2 text-center font-semibold md:w-[52px] lg:w-16" title="Kampe">K</th>
      <th class="w-[22px] pb-2 text-center font-semibold md:w-[52px] lg:w-16" title="Vundne">V</th>
      <th class="w-[22px] pb-2 text-center font-semibold md:w-[52px] lg:w-16" title="Tabte">T</th>
      <th class="w-[46px] pb-2 text-center font-semibold md:w-[72px] lg:w-[88px]" title="Sæt vundne–tabte">Sæt</th>
      <th class="w-[68px] pb-2 text-center font-semibold md:w-[104px] lg:w-[120px]" title="Bolde vundne–tabte">Bolde</th>
      <th class="w-7 pb-2 text-right font-semibold md:w-9 lg:w-10" title="Point">P</th>
    </tr>
  </thead>
  <tbody>
    {#each table.rows as row}
      {@const leader = row.pos === '1'}
      <tr class="border-t border-line last:border-b">
        <td class="py-3 md:py-3.5">
          {#if leader}
            <span class="relative inline-block"><Crown class="-top-[11px] -left-[3px] h-3 w-3.5" /><span class="gold font-bold">{row.pos}</span></span>
          {:else}
            <span class="text-mute">{row.pos}</span>
          {/if}
        </td>
        <td class="max-w-0 py-3 md:py-3.5">
          {#if row.team?.id}
            <a href="#/hold/{row.team.id}" class="block truncate pr-3.5 text-[15px] {leader ? 'font-semibold' : 'font-medium'}">
              <TeamName team={row.team} nameClass={leader ? 'gold' : ''} />
            </a>
          {:else}
            <span class="block truncate">{row.team?.name}</span>
          {/if}
        </td>
        <td class="py-3 text-center md:py-3.5">{row.played}</td>
        <td class="py-3 text-center md:py-3.5">{row.won}</td>
        <td class="py-3 text-center md:py-3.5">{row.lost}</td>
        <td class="py-3 text-center text-[13px] text-mute md:py-3.5 md:text-[15px]">{row.setsWon}–{row.setsLost}</td>
        <td class="py-3 text-center text-[13px] text-mute md:py-3.5 md:text-[15px]">{row.balls}</td>
        <td class="py-3 text-right font-bold md:py-3.5">{row.points}</td>
      </tr>
    {/each}
  </tbody>
</table>
