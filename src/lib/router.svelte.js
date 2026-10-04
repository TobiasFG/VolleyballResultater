// Hash routing keeps the app a plain static site (no server rewrites needed on GitHub Pages).
const current = () => decodeURIComponent(location.hash.slice(1)) || '/';

export const route = $state({ path: current() });

addEventListener('hashchange', () => {
  route.path = current();
  scrollTo(0, 0);
});

export function goBack() {
  if (history.length > 1) history.back();
  else location.hash = '#/';
}
