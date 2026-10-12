<script>
  // Playing time per player for one team, from the scoresheet replay (matchlog.js participation).
  let { team, name, side } = $props();

  const share = (row) => Math.round((100 * row.rallies) / team.rallies);
</script>

<table class="w-full border-collapse text-sm tabular-nums">
  <thead class="text-[11px] font-semibold tracking-[0.08em] text-mute uppercase">
    <tr>
      <th class="pb-2 text-left text-xs font-normal tracking-normal normal-case">
        <span class="flex min-w-0 items-center gap-2 text-ink">
          <span class="size-2 shrink-0 rounded-full {side === 0 ? 'bg-home' : 'bg-away'}"></span>
          <span class="truncate">{name}</span>
        </span>
      </th>
      <th class="w-12 pb-2 text-right font-semibold">Start</th>
      <th class="w-10 pb-2 text-right font-semibold">Ind</th>
      <th class="w-28 pb-2 text-right font-semibold">På banen</th>
    </tr>
  </thead>
  <tbody>
    {#each team.rows as row}
      <tr class="h-10 border-t border-line last:border-b">
        <td class="max-w-0 pr-2">
          <div class="flex min-w-0 gap-2.5">
            <span class="w-6 shrink-0 text-right text-mute">{row.no}</span>
            <span class="truncate">{row.name}</span>
            {#if row.libero}<span class="shrink-0 text-xs text-mute">libero</span>{/if}
          </div>
        </td>
        <td class="text-right {row.started ? '' : 'text-mute'}">{row.started || '–'}</td>
        <td class="text-right text-mute">{row.subbed || '–'}</td>
        <td>
            <div class="flex items-center justify-end gap-2">
              <span class="text-xs text-mute">{share(row)} %</span>
              <span class="relative h-1.5 w-11 overflow-hidden rounded-full bg-line">
                <span class="absolute inset-y-0 left-0 rounded-full {side === 0 ? 'bg-home' : 'bg-away'}" style="width: {share(row)}%"></span>
              </span>
            </div>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
