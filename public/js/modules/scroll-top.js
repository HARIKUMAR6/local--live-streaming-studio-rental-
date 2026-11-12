import { icons } from './icons.js';
const THRESHOLD = 400;

export function initScrollTop() {
  if (document.querySelector('.scroll-top')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'icon-btn scroll-top';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = icons.up;
  document.body.appendChild(btn);

  let ticking = false;
  const update = () => { btn.classList.toggle('is-visible', window.scrollY > THRESHOLD); ticking = false; };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  btn.addEventListener('click', () => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  update();
}
