import { translate, tr } from '../modules/direction.js';
import { icons, hydrateIcons } from '../modules/icons.js';
import { fromIso } from './store.js';

export const dir = () => document.documentElement.getAttribute('dir') || 'ltr';
export const locale = () => 'en-US'; // content is English in both directions
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtDate = (iso, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat(locale(), o).format(fromIso(iso));
export const fmtLong = (iso) => fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const fmtShort = (iso) => fmtDate(iso, { day: 'numeric', month: 'short', year: 'numeric' });
export const ago = (isoTime) => {
  const diff = (new Date(isoTime) - Date.now()) / 36e5; // hours
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
  return Math.abs(diff) < 24 ? rtf.format(Math.round(diff), 'hour') : rtf.format(Math.round(diff / 24), 'day');
};
export const ic = (n) => `<span class="ico" data-icon="${n}"></span>`;
export const tx = (scope) => { hydrateIcons(scope); translate(dir(), scope); };
export { tr, icons };

/* ---------- toast ---------- */
export function toast(msg, type = 'ok') {
  const host = document.getElementById('toasts'); if (!host) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="ico">${type === 'error' ? icons.alert : type === 'info' ? icons.info : icons.check}</span><span>${esc(tr(msg))}</span>`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/* ---------- dialog ---------- */
let lastFocus = null;
export function openDialog(html, onMount) {
  const dlg = document.getElementById('dlg');
  lastFocus = document.activeElement;
  dlg.innerHTML = html;
  const h = dlg.querySelector('h2'); if (h) h.id = 'dlg-title';
  tx(dlg);
  if (!dlg.open) dlg.showModal();
  onMount?.(dlg);
  return dlg;
}
export function closeDialog() {
  const dlg = document.getElementById('dlg');
  if (dlg.open) dlg.close();
}
export function initDialog() {
  const dlg = document.getElementById('dlg');
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  dlg.addEventListener('close', () => { lastFocus?.focus?.(); });
}
