const dayFormat = new Intl.DateTimeFormat('da-DK', { weekday: 'long', day: 'numeric', month: 'long' });
const dayYearFormat = new Intl.DateTimeFormat('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortFormat = new Intl.DateTimeFormat('da-DK', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFormat = new Intl.DateTimeFormat('da-DK', { hour: '2-digit', minute: '2-digit' });

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatDay(date) {
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return capitalize((sameYear ? dayFormat : dayYearFormat).format(date));
}

export const formatShortDay = (date) => capitalize(shortFormat.format(date));
export const formatTime = (date) => timeFormat.format(date);

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Sorted matches -> [{ date, matches }] per calendar day. */
export function groupByDay(matches) {
  const groups = [];
  for (const m of matches) {
    const last = groups.at(-1);
    if (last && last.date.toDateString() === m.date?.toDateString()) last.matches.push(m);
    else groups.push({ date: m.date, matches: [m] });
  }
  return groups;
}

export const byDate = (a, b) => (a.date ?? 0) - (b.date ?? 0);

export const mapsUrl = (parts) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(parts.join(', '));
