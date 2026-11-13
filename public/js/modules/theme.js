import { icons } from './icons.js';
const KEY = 'sr-theme';
const root = document.documentElement;

export function getTheme() {
  try { const t = localStorage.getItem(KEY); if (t) return t; } catch {}
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function setTheme(t) {
  root.setAttribute('data-theme', t);
  try { localStorage.setItem(KEY, t); } catch {}
  document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(t === 'dark'));
    const label = t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    b.setAttribute('data-en-aria-label', label);
    b.setAttribute('aria-label', label);
    const slot = b.querySelector('[data-toggle-icon]') || b;
    slot.innerHTML = t === 'dark' ? icons.sun : icons.moon;
  });
}

export function initTheme() {
  setTheme(root.getAttribute('data-theme') || getTheme());
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-theme-toggle]')) setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}
