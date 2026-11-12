import { initApp } from '../app-shell.js';
import { icons } from '../modules/icons.js';
import { setTheme } from '../modules/theme.js';
import { setDir } from '../modules/direction.js';
import { brand } from '../data.js';
import { load, save, log, createBooking, cancelBooking, endSession, studioOf, categoryOf, startOf, hh, takenHours, slotFits, quote } from './store.js';
import { toast, tx, tr, esc, openDialog, closeDialog, initDialog, fmtDate, dir } from './ui.js';
import * as V from './views.js';

const authed = true; // The dashboard opens directly; it never redirects through the login page.

const ROUTES = [
  ['overview', 'Overview', 'Overview', 'dashboard'],
  ['book', 'Book a studio', 'Book', 'calendarPlus'],
  ['bookings', 'My bookings', 'Bookings', 'calendarCheck'],
  ['invoices', 'Invoices', 'Invoices', 'fileText'],
  ['profile', 'Profile and settings', 'Profile', 'user'],
];
const app = document.getElementById('app');
let draft = V.newDraft();
let tab = 'upcoming';
let first = true;

/* ---------- shell ---------- */
const initials = () => load().profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
function shell() {
  const p = load().profile;
  app.innerHTML = `
  <div class="app-shell" id="shell">
    <aside class="app-sidebar" id="sidebar" aria-label="Portal sidebar">
      <a class="app-brand" href="index.html" aria-label="${brand.name} ${brand.suffix}">${icons.logo}<span class="app-brand__t"><b>${brand.name}</b><small>Client portal</small></span></a>
      <nav class="app-nav" aria-label="Portal">${ROUTES.map(([k, label, , ic]) => `<a class="app-nav__link" href="#/${k}" data-route="${k}" title="${label}"><span class="ico">${icons[ic]}</span><span class="app-nav__label">${label}</span></a>`).join('')}</nav>
      <div class="app-next" id="next"></div>
      <button type="button" class="app-nav__link app-signout" data-action="signout" title="Sign out"><span class="ico">${icons.logOut}</span><span class="app-nav__label">Sign out</span></button>
    </aside>
    <div class="app-main">
      <header class="app-header">
        <button type="button" class="icon-btn app-collapse" data-action="collapse" aria-label="Collapse sidebar" aria-controls="sidebar" aria-expanded="true">${icons.panel}</button>
        <a class="app-brand app-brand--m" href="#/overview" aria-label="Overview">${icons.logo}</a>
        <span class="app-header__sp"></span>
        <a class="btn btn-sm max-md:hidden" href="#/book"><span class="ico">${icons.plus}</span><span>New booking</span></a>
        <button type="button" class="icon-btn" data-theme-toggle></button>
        <button type="button" class="icon-btn" data-dir-toggle></button>
        <div class="userm" data-userm>
          <button type="button" class="ava ava--btn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu" data-action="usermenu">${esc(initials())}</button>
          <div class="userm__panel" hidden><p class="userm__who"><b>${esc(p.name)}</b><span class="meta">${esc(p.email)}</span></p>
            <a href="#/profile"><span class="ico">${icons.user}</span><span>Profile and settings</span></a>
            <button type="button" data-action="signout"><span class="ico">${icons.logOut}</span><span>Sign out</span></button></div></div>
      </header>
      <main id="main" class="app-view" tabindex="-1"></main>
    </div>
    <nav class="app-tabbar" aria-label="Portal">${ROUTES.map(([k, , short, ic]) => `<a href="#/${k}" data-route="${k}"><span class="ico">${icons[ic]}</span><span>${short}</span></a>`).join('')}</nav>
  </div>`;
  const stored = (() => { try { return localStorage.getItem('sr-sidebar'); } catch { return null; } })();
  setCollapsed(stored ? stored === 'collapsed' : innerWidth < 1024, false);
}
function setCollapsed(c, persist = true) {
  document.getElementById('shell').dataset.collapsed = String(c);
  const b = document.querySelector('.app-collapse');
  b.setAttribute('aria-expanded', String(!c));
  const label = c ? 'Expand sidebar' : 'Collapse sidebar';
  b.setAttribute('data-en-aria-label', label); b.setAttribute('aria-label', dir() === 'rtl' ? tr(label) : label);
  if (persist) { try { localStorage.setItem('sr-sidebar', c ? 'collapsed' : 'open'); } catch {} }
}
function updateNext() {
  const up = load().bookings.filter((b) => categoryOf(b) === 'upcoming').sort((a, b) => startOf(a) - startOf(b))[0];
  const el = document.getElementById('next');
  el.innerHTML = up ? `<p class="app-next__l"><span class="tally"></span><span>Next session</span></p><p class="app-next__t">${esc(studioOf(up.studio).name)}</p><p class="meta"><bdi class="num">${esc(fmtDate(up.date))} &middot; ${hh(up.start)}</bdi></p>`
    : '<p class="app-next__l"><span>No sessions scheduled</span></p>';
  tx(el);
}

/* ---------- views ---------- */
const route = () => { const r = (location.hash.replace(/^#\/?/, '') || 'overview').split('?')[0]; return ROUTES.some((x) => x[0] === r) ? r : 'overview'; };
function show(focus = true) {
  const r = route(), main = document.getElementById('main');
  const th = document.documentElement.getAttribute('data-theme');
  main.innerHTML = r === 'overview' ? V.overview() : r === 'book' ? V.book(draft) : r === 'bookings' ? V.bookings(tab) : r === 'invoices' ? V.invoices() : V.profile(th, dir());
  tx(main);
  document.querySelectorAll('[data-route]').forEach((a) => (a.getAttribute('data-route') === r ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const [, label] = ROUTES.find((x) => x[0] === r);
  document.title = `${label} | ${brand.name} ${brand.suffix}`;
  updateNext();
  if (focus && !first) { main.focus({ preventScroll: true }); scrollTo(0, 0); }
  first = false;
}
function showBook(full) {
  if (full) { show(false); return; }
  document.getElementById('stepper').innerHTML = V.stepper(draft);
  const st = document.getElementById('step'); st.innerHTML = V.stepHtml(draft); tx(st);
  document.getElementById('summary').innerHTML = V.summary(draft); tx(document.getElementById('summary'));
  tx(document.getElementById('stepper'));
}
const refreshSummary = () => { const s = document.getElementById('summary'); s.innerHTML = V.summary(draft); tx(s); };
const refreshSlots = () => { const s = document.getElementById('slots'); if (s) { s.innerHTML = V.slotsHtml(draft); tx(s); } };
const stepError = (msg) => { const e = document.getElementById('step-error'); if (!e) return; e.hidden = !msg; e.textContent = msg ? tr(msg) : ''; };

/* ---------- invoice helpers ---------- */
function printInvoice(id) {
  const area = document.getElementById('print-area');
  area.innerHTML = V.invoiceDoc(id); tx(area);
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 50);
}
function downloadInvoice(id) {
  const css = 'body{font:14px/1.5 system-ui,sans-serif;color:#111820;max-width:720px;margin:2rem auto;padding:0 1rem}table{width:100%;border-collapse:collapse}th,td{text-align:start;padding:.5rem;border-bottom:1px solid #ccd}.doc__head,.doc__parties{display:flex;justify-content:space-between;gap:2rem;margin-bottom:1.5rem}.totals{display:grid;gap:.25rem;margin-top:1rem}.totals div{display:flex;justify-content:space-between}.block{display:block}.status{border:1px solid #888;padding:0 .5rem;border-radius:99px}h2,h3{margin:0 0 .25rem}.ico{display:none}';
  const html = `<!doctype html><html lang="${dir() === 'rtl' ? 'ar' : 'en'}" dir="${dir()}"><head><meta charset="utf-8"><title>Invoice ${id}</title><style>${css}</style></head><body>${V.invoiceDoc(id)}</body></html>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = `Invoice-${id}.html`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Invoice downloaded');
}

/* ---------- events ---------- */
const actions = {
  collapse: () => setCollapsed(document.getElementById('shell').dataset.collapsed !== 'true'),
  signout: () => { endSession(); location.href = 'login.html'; },
  usermenu: (el) => { const p = el.parentElement.querySelector('.userm__panel'); const open = p.hidden; p.hidden = !open; el.setAttribute('aria-expanded', String(open)); },
  prev: () => { draft.step -= 1; showBook(); document.getElementById('step').focus({ preventScroll: true }); },
  next: () => {
    if (draft.step === 2) {
      if (!draft.date) return stepError('Choose a date to continue.');
      if (draft.start == null) return stepError('Pick a start time to continue.');
    }
    draft.step += 1; showBook(); document.getElementById('step').focus({ preventScroll: true }); scrollTo(0, 0);
  },
  confirm: (el) => {
    if (!draft.agree) return stepError('Please accept the booking terms to continue.');
    if (!slotFits(takenHours(draft.studio, draft.date, load().bookings), draft.start, draft.hours)) return stepError('That time was just taken. Please choose another start time.');
    el.disabled = true; el.querySelector('span').textContent = tr('Confirming...');
    setTimeout(() => { draft.done = createBooking(draft); show(false); toast('Booking confirmed'); scrollTo(0, 0); document.getElementById('step').focus({ preventScroll: true }); }, 800);
  },
  again: () => { draft = V.newDraft(); show(false); },
  details: (el) => openDialog(V.detailsDialog(el.dataset.id)),
  'cancel-ask': (el) => openDialog(V.cancelDialog(el.dataset.id)),
  'cancel-do': (el) => { cancelBooking(el.dataset.id); closeDialog(); toast('Booking cancelled'); show(false); },
  'inv-view': (el) => openDialog(V.invoiceDialog(el.dataset.id)),
  'inv-print': (el) => { closeDialog(); printInvoice(el.dataset.id); },
  'inv-dl': (el) => downloadInvoice(el.dataset.id),
};
document.addEventListener('click', (e) => {
  const um = document.querySelector('[data-userm]');
  if (um && !e.target.closest('[data-userm]')) { um.querySelector('.userm__panel').hidden = true; um.querySelector('[data-action="usermenu"]').setAttribute('aria-expanded', 'false'); }
  if (e.target.closest('.userm__panel a')) um.querySelector('.userm__panel').hidden = true;
  const el = e.target.closest('[data-action]');
  if (el && actions[el.dataset.action]) { e.preventDefault(); actions[el.dataset.action](el); return; }
  const t = e.target.closest('[data-tab]');
  if (t) { tab = t.dataset.tab; show(false); document.getElementById('t-' + tab).focus(); return; }
  const slot = e.target.closest('[data-slot]');
  if (slot && !slot.disabled) { draft.start = Number(slot.dataset.slot); document.querySelectorAll('[data-slot]').forEach((b) => b.setAttribute('aria-pressed', String(b === slot))); stepError(''); refreshSummary(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { const um = document.querySelector('.userm__panel'); if (um && !um.hidden) { um.hidden = true; document.querySelector('[data-action="usermenu"]').setAttribute('aria-expanded', 'false'); document.querySelector('[data-action="usermenu"]').focus(); } }
  const t = e.target.closest?.('[role="tab"][data-tab]');
  if (t && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const tabs = [...document.querySelectorAll('[data-tab]')]; const rtl = dir() === 'rtl';
    const n = (tabs.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1) + tabs.length) % tabs.length;
    e.preventDefault(); tab = tabs[n].dataset.tab; show(false); document.getElementById('t-' + tab).focus();
  }
});
document.addEventListener('input', (e) => {
  const n = e.target.name;
  if (e.target.closest('#step')) {
    if (n === 'date') { draft.date = e.target.value; draft.start = null; refreshSlots(); refreshSummary(); stepError(''); }
    if (n === 'hours') {
      draft.hours = Number(e.target.value);
      const lab = e.target.closest('.field').querySelector('label b'); if (lab) lab.textContent = draft.hours;
      if (draft.start != null && draft.date && !slotFits(takenHours(draft.studio, draft.date, load().bookings), draft.start, draft.hours)) draft.start = null;
      refreshSlots(); refreshSummary();
    }
  }
  if (e.target.closest('[data-form="password"]') && n === 'next') strength(e.target.value);
});
document.addEventListener('change', (e) => {
  const n = e.target.name, v = e.target.value;
  if (e.target.closest('#step')) {
    if (n === 'studio') { draft.studio = v; if (draft.start != null && draft.date && !slotFits(takenHours(v, draft.date, load().bookings), draft.start, draft.hours)) draft.start = null; refreshSummary(); }
    if (n === 'addon' || n === 'gear') { const k = n === 'addon' ? 'addons' : 'gear'; draft[k] = [...document.querySelectorAll(`#step [name="${n}"]:checked`)].map((i) => i.value); refreshSummary(); }
    if (n === 'agree') { draft.agree = e.target.checked; stepError(''); }
  }
  if (n === 'theme') setTheme(v);
  if (n === 'dir') setDir(v);
  if (e.target.closest('[data-form="prefs"]')) { const p = load().prefs; p[n] = e.target.checked; log('prefs'); save(); toast('Preferences saved'); }
});
document.addEventListener('themechange', (e) => { const r = document.querySelector('[name="theme"][value="' + e.detail + '"]'); if (r) r.checked = true; });
document.addEventListener('dirchange', () => { if (!first) show(false); setCollapsed(document.getElementById('shell').dataset.collapsed === 'true', false); });
window.addEventListener('hashchange', () => { if (authed) show(true); });

/* ---------- forms ---------- */
function strength(pw) {
  let s = 0; if (pw.length >= 8) s++; if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++; if (/\d/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  const bar = document.querySelector('[data-strength]'); bar.dataset.strength = String(pw ? s : 0);
  document.querySelector('[data-strength-label]').textContent = tr(pw ? ['Weak', 'Weak', 'Fair', 'Good', 'Strong'][s] : 'Use 8 or more characters with a mix of letters and numbers.');
}
const setErr = (form, name, msg) => { const e = form.querySelector(`[data-error="${name}"]`); e.textContent = msg ? tr(msg) : ''; form.elements[name].setAttribute('aria-invalid', String(Boolean(msg))); return !msg; };
document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]'); if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form, f = form.elements;
  if (kind === 'profile') {
    const ok = [setErr(form, 'name', f.name.value.trim().length < 2 ? 'Please enter your name.' : ''), setErr(form, 'email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()) ? '' : 'Please enter a valid email address.')];
    if (ok.includes(false)) return form.querySelector('[aria-invalid="true"]').focus();
    Object.assign(load().profile, { name: f.name.value.trim(), company: f.company.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), zone: f.zone.value });
    log('profile'); save(); toast('Profile saved');
    document.querySelector('.ava--btn').textContent = initials(); document.querySelector('.userm__who').innerHTML = `<b>${esc(load().profile.name)}</b><span class="meta">${esc(load().profile.email)}</span>`;
    show(false);
  }
  if (kind === 'password') {
    const n = f.next.value;
    const ok = [setErr(form, 'current', f.current.value.length < 8 ? 'Enter your current password.' : ''),
      setErr(form, 'next', n.length < 8 || !/\d/.test(n) || !/[A-Za-z]/.test(n) ? 'Use at least 8 characters, including a letter and a number.' : n === f.current.value ? 'Choose a password you have not used before.' : ''),
      setErr(form, 'confirm', f.confirm.value !== n ? 'Passwords do not match.' : '')];
    if (ok.includes(false)) return form.querySelector('[aria-invalid="true"]').focus();
    form.reset(); strength(''); log('password'); save(); toast('Password updated');
  }
});

/* ---------- init ---------- */
if (authed) {
  shell();
  initDialog();
  initApp();
  show(false);
  tx(document.body);
}
