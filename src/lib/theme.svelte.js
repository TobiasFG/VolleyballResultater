// Light/dark theme: 'auto' follows the device, 'light'/'dark' override it. Saved in this browser only.
// index.html applies the saved value before first paint; this keeps it in sync afterwards.
const KEY = 'theme';
const MODES = ['auto', 'light', 'dark'];

function read() {
  try {
    const saved = localStorage.getItem(KEY);
    return MODES.includes(saved) ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

export const theme = $state({ mode: read() });

const media = matchMedia('(prefers-color-scheme: dark)');

function apply() {
  const dark = theme.mode === 'dark' || (theme.mode === 'auto' && media.matches);
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1b1e23' : '#fafaf7');
}

media.addEventListener('change', apply);
apply();

export function setTheme(mode) {
  theme.mode = mode;
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // Storage blocked (private mode): the choice just won't survive a reload.
  }
  apply();
}

export const cycleTheme = () => setTheme({ auto: 'light', light: 'dark', dark: 'auto' }[theme.mode]);
