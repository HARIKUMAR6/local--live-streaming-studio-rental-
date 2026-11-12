import { ar } from '../i18n-ar.js';
const KEY = 'sr-dir';
const root = document.documentElement;
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const ATTRS = ['alt', 'aria-label', 'placeholder', 'title'];
const originals = new WeakMap(); // text node -> original English

// Automatic translation: any text node / attribute whose English text is a key in i18n-ar.js is swapped.
export function translate(d, scope = document.body) {
  const w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (/^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.parentElement?.tagName) || n.parentElement?.closest('.brand') || !n.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (!originals.has(n)) originals.set(n, n.nodeValue);
    const orig = originals.get(n);
    const key = norm(orig);
    const lead = orig.match(/^\s*/)[0];
    const trail = orig.match(/\s*$/)[0];
    n.nodeValue = d === 'rtl' && ar[key] ? lead + ar[key] + trail : orig;
  }
  scope.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
    ATTRS.forEach((a) => {
      if (!el.hasAttribute(a)) return;
      const store = `data-en-${a}`;
      if (!el.hasAttribute(store)) el.setAttribute(store, el.getAttribute(a));
      const orig = el.getAttribute(store);
      el.setAttribute(a, d === 'rtl' && ar[norm(orig)] ? ar[norm(orig)] : orig);
    });
  });
}

// Translate a single dynamic string for the current direction.
export const tr = (k) => (root.getAttribute('dir') === 'rtl' && ar[k]) || k;

export function setDir(d) {
  root.setAttribute('dir', d);
  root.setAttribute('lang', d === 'rtl' ? 'ar' : 'en');
  try { localStorage.setItem(KEY, d); } catch {}
  document.querySelectorAll('[data-dir-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(d === 'rtl'));
    b.setAttribute('data-en-aria-label', d === 'rtl' ? 'Switch to left-to-right' : 'Switch to right-to-left');
    b.setAttribute('aria-label', d === 'rtl' ? ar['Switch to left-to-right'] : 'Switch to right-to-left');
    // Text only: both labels shown, current direction highlighted.
    const slot = b.querySelector('[data-toggle-icon]');
    if (!slot) b.classList.add('dir-btn');
    (slot || b).innerHTML = `<span class="dir-seg" aria-hidden="true"><span${d === 'ltr' ? ' class="is-on"' : ''}>LTR</span><span${d === 'rtl' ? ' class="is-on"' : ''}>RTL</span></span>`;
  });
  translate(d);
  document.dispatchEvent(new CustomEvent('dirchange', { detail: d }));
}

export function initDirection() {
  setDir(root.getAttribute('dir') || 'ltr');
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-dir-toggle]')) setDir(root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl');
  });
}
