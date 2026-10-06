<script>
  import { isFavorite } from '../favorites.svelte.js';

  // A team's name, with a small star raised at its top right when the team is a favourite.
  // nameClass styles the name only, so effects like the gold sweep never reach the star.
  let { team, nameClass = '' } = $props();
</script>

<span class="relative inline-block"><span class={nameClass}>{team?.name ?? '–'}</span>{#if team?.id && isFavorite(team.id)}<svg
      class="absolute -top-[3px] -right-[13px] size-[11px] text-fav"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
      role="img"
      aria-label="Favorit"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg
    >{/if}</span
>
