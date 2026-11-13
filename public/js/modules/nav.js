import { icons } from './icons.js';

// Dropdowns (click only), full-screen mobile menu, Escape + outside-click closing.
export function initNav() {
  const btn = document.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('mobile-menu');
  const drops = [...document.querySelectorAll('[data-dropdown]')];
  const lg = matchMedia('(min-width: 64rem)');

  const setDrop = (d, open) => {
    const b = d.querySelector('.dropdown__btn');
    const p = d.querySelector('.dropdown__panel, .m-acc__panel');
    b.setAttribute('aria-expanded', String(open));
    p.hidden = !open;
    d.classList.toggle('is-open', open);
  };
  const closeDrops = (except) => drops.forEach((d) => { if (d !== except) setDrop(d, false); });
  drops.forEach((d) => {
    setDrop(d, false);
    d.querySelector('.dropdown__btn').addEventListener('click', () => {
      const open = !d.classList.contains('is-open');
      if (d.classList.contains('dropdown')) closeDrops(d);
      setDrop(d, open);
    });
  });

  const setMenu = (open) => {
    if (!btn || !menu) return;
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    const label = open ? 'Close menu' : 'Open menu';
    btn.setAttribute('data-en-aria-label', label);
    btn.setAttribute('aria-label', label);
    btn.innerHTML = open ? icons.close : icons.menu;
    document.documentElement.classList.toggle('menu-lock', open);
    if (!open) drops.filter((d) => menu.contains(d)).forEach((d) => setDrop(d, false));
  };
  setMenu(false);
  const menuOpen = () => menu && menu.classList.contains('is-open');
  btn?.addEventListener('click', () => setMenu(!menuOpen()));
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openDrop = drops.find((d) => d.classList.contains('is-open') && d.classList.contains('dropdown'));
    if (openDrop) { setDrop(openDrop, false); openDrop.querySelector('.dropdown__btn').focus(); return; }
    if (menuOpen()) { setMenu(false); btn.focus(); }
  });
  document.addEventListener('click', (e) => {
    const path = e.composedPath();
    drops.forEach((d) => { if (d.classList.contains('dropdown') && !path.includes(d)) setDrop(d, false); });
    if (menuOpen() && !path.includes(menu) && !path.includes(btn)) setMenu(false);
  });
  lg.addEventListener('change', (m) => { if (m.matches) { setMenu(false); closeDrops(); } });
}
