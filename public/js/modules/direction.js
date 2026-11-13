const KEY = 'sr-dir';
const root = document.documentElement;

// The RTL toggle changes layout direction only. All content stays in English, so these
// two helpers are intentionally inert; they exist so existing call sites keep working.
export const translate = () => {};
export const tr = (k) => k;

export function setDir(d) {
  root.setAttribute('dir', d);
  root.setAttribute('lang', 'en');
  try { localStorage.setItem(KEY, d); } catch {}
  document.querySelectorAll('[data-dir-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(d === 'rtl'));
    b.setAttribute('aria-label', d === 'rtl' ? 'Switch to left-to-right' : 'Switch to right-to-left');
    // Text only: both labels shown, current direction highlighted.
    const slot = b.querySelector('[data-toggle-icon]');
    if (!slot) b.classList.add('dir-btn');
    (slot || b).innerHTML = `<span class="dir-seg" aria-hidden="true"><span${d === 'ltr' ? ' class="is-on"' : ''}>LTR</span><span${d === 'rtl' ? ' class="is-on"' : ''}>RTL</span></span>`;
  });
  document.dispatchEvent(new CustomEvent('dirchange', { detail: d }));
}

export function initDirection() {
  setDir(root.getAttribute('dir') || 'ltr');
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-dir-toggle]')) setDir(root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl');
  });
}
