import { isFavorite } from './favorites.svelte.js';

/**
 * Colour for one side of a score: 'win' or 'loss' when exactly one of the two teams is a favourite
 * (so the colour always reads as "my team's result"), otherwise null.
 * score is [home, away]; side is 0 (home) or 1 (away).
 */
export function tone(home, away, [h, a], side) {
  const mine = [home, away].map((t) => !!t?.id && isFavorite(t.id));
  if (mine[0] === mine[1] || !mine[side]) return null;
  return (side === 0 ? h > a : a > h) ? 'win' : 'loss';
}

export const toneClass = (t) => (t === 'win' ? 'text-win' : t === 'loss' ? 'text-loss' : '');
