// Favourite teams, kept in this browser only.
// Each entry: { id: HoldId, name, poolId, poolTitle }.
const KEY = 'favorites';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

export const favorites = $state(read());

export const isFavorite = (id) => favorites.some((f) => f.id === id);

export function toggleFavorite(team) {
  const i = favorites.findIndex((f) => f.id === team.id);
  if (i >= 0) favorites.splice(i, 1);
  else favorites.push(team);
  try {
    localStorage.setItem(KEY, JSON.stringify(favorites));
  } catch {
    // Storage blocked (private mode): favourites just won't survive a reload.
  }
}
