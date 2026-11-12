import { contact } from '../data.js';
import { STUDIOS, ADDONS, GEAR, TAX, DEPOSIT, OPEN, CLOSE, studioOf, quote, money, load, categoryOf, startOf, endOf, hh, toIso, addDays, takenHours, slotFits } from './store.js';
import { esc, ic, fmtDate, fmtLong, fmtShort, ago } from './ui.js';

const I = 'public/assets/img/';
const thumb = (s, cls = 'bk__img') => `<img class="${cls}" src="${I}${s.img}-sm.jpg" alt="${esc(s.alt)}" loading="lazy" decoding="async">`;
const num = (v) => `<bdi class="num">${v}</bdi>`;
const range = (b) => `<bdi class="num">${hh(b.start)} - ${hh(b.start + b.hours)}</bdi>`;
const CHIP = { confirmed: ['ok', 'Confirmed'], completed: ['muted', 'Completed'], cancelled: ['bad', 'Cancelled'], due: ['warn', 'Due'], paid: ['ok', 'Paid'], void: ['muted', 'Void'] };
export const chip = (k) => `<span class="status status--${CHIP[k][0]}"><i></i><span>${CHIP[k][1]}</span></span>`;
const totalOf = (b) => quote(b).total;
const invFor = (id) => load().invoices.find((i) => i.booking === id);
const firstName = () => load().profile.name.split(' ')[0];

/* ================= Overview ================= */
export function overview() {
  const s = load();
  const up = s.bookings.filter((b) => categoryOf(b) === 'upcoming').sort((a, b) => startOf(a) - startOf(b));
  const ym = toIso(new Date()).slice(0, 7);
  const hours = s.bookings.filter((b) => b.status !== 'cancelled' && b.date.startsWith(ym)).reduce((t, b) => t + b.hours, 0);
  const due = s.invoices.filter((i) => i.status === 'due').reduce((t, i) => t + totalOf(s.bookings.find((b) => b.id === i.booking)), 0);
  const paid = s.invoices.filter((i) => i.status === 'paid').reduce((t, i) => t + totalOf(s.bookings.find((b) => b.id === i.booking)), 0);
  const meter = (label, value, sub) => `<div class="meter"><p class="meter__label">${label}</p><p class="meter__value">${value}</p><p class="meter__sub">${sub}</p></div>`;
  const acts = { booked: 'Booking confirmed', cancelled: 'Booking cancelled', invoice: 'Invoice issued', completed: 'Session completed', profile: 'Profile updated', password: 'Password updated', prefs: 'Preferences saved' };
  return `
  <header class="view-head">
    <div><p class="eyebrow">Client portal</p><h1>Welcome back, <span>${esc(firstName())}</span></h1><p class="lead">Here is what is happening with your studio sessions.</p></div>
    <a class="btn" href="#/book"><span class="ico" data-icon="plus"></span><span>Book a studio</span></a>
  </header>
  <section class="metrics" aria-label="Summary">
    ${meter('Upcoming sessions', num(up.length), up[0] ? `<span>Next:</span> ${num(esc(fmtDate(up[0].date)))}` : '<span>Nothing scheduled</span>')}
    ${meter('Hours this month', num(hours), '<span>Across all studios</span>')}
    ${meter('Outstanding', num(money(due)), '<span>Invoices awaiting payment</span>')}
    ${meter('Paid to date', num(money(paid)), '<span>Completed sessions</span>')}
  </section>
  <div class="grid-2">
    <section class="panel" aria-labelledby="up-h"><header class="panel__head"><h2 id="up-h">Upcoming bookings</h2><a class="link-arrow" href="#/bookings"><span>View all</span><span class="ico" data-icon="arrow"></span></a></header>
      ${up.length ? `<ul class="list">${up.slice(0, 3).map((b) => `<li class="bk bk--mini">${thumb(studioOf(b.studio))}<div><h3>${esc(studioOf(b.studio).name)}</h3><p class="meta">${num(esc(fmtDate(b.date)))} &middot; ${range(b)}</p></div>${chip('confirmed')}</li>`).join('')}</ul>`
      : `<div class="empty"><p>You have no upcoming sessions.</p><a class="btn btn-ghost" href="#/book"><span>Book a studio</span></a></div>`}
    </section>
    <section class="panel" aria-labelledby="act-h"><header class="panel__head"><h2 id="act-h">Recent activity</h2></header>
      <ol class="feed">${s.activity.slice(0, 6).map((a) => `<li><span class="feed__dot"></span><div><p>${acts[a.type] || a.type}</p><p class="meta">${a.ref ? num(esc(a.ref)) + ' &middot; ' : ''}<span>${esc(ago(a.at))}</span></p></div></li>`).join('')}</ol>
    </section>
  </div>`;
}

/* ================= Book a studio ================= */
export const STEPS = ['Studio', 'Date and time', 'Extras', 'Review'];
export const newDraft = () => ({ step: 1, studio: 'talk', date: '', start: null, hours: 4, addons: ['eng'], gear: [], agree: false, done: null });

export function slotsHtml(d) {
  if (!d.date) return '<p class="meta">Choose a date to see available start times.</p>';
  const taken = takenHours(d.studio, d.date, load().bookings);
  const items = [];
  for (let h = OPEN; h <= CLOSE - 1; h++) {
    const ok = slotFits(taken, h, d.hours);
    items.push(`<button type="button" class="slot" data-slot="${h}" aria-pressed="${d.start === h}" ${ok ? '' : 'disabled'}><bdi class="num">${hh(h)}</bdi>${ok ? '' : '<small>Booked</small>'}</button>`);
  }
  const any = items.some((x) => !x.includes('disabled'));
  return `<div class="slots" role="group" aria-label="Start times">${items.join('')}</div>${any ? '' : '<p class="form-note">No start time fits this duration on that day. Try a shorter session or another date.</p>'}`;
}

export function summary(d) {
  const s = studioOf(d.studio);
  const q = quote({ studio: d.studio, hours: d.hours, addons: d.addons, gear: d.gear });
  const when = d.date ? `${num(esc(fmtDate(d.date)))}${d.start != null ? ` &middot; ${range({ start: d.start, hours: d.hours })}` : ''}` : '<span class="meta">No date chosen yet</span>';
  return `
    <h2 class="panel__title">Your booking</h2>
    <div class="sum-studio">${thumb(s, 'sum-studio__img')}<div><h3>${esc(s.name)}</h3><p class="meta">${when}</p></div></div>
    <ul class="lines">${q.lines.map((l) => `<li><span>${l.name}${l.detail ? ` <small class="meta">${num(esc(l.detail))}</small>` : ''}</span>${num(money(l.amount))}</li>`).join('')}</ul>
    <dl class="totals"><div><dt>Subtotal</dt><dd>${num(money(q.subtotal))}</dd></div><div><dt>Tax <small class="meta">${num((TAX * 100).toFixed(2) + '%')}</small></dt><dd>${num(money(q.tax))}</dd></div>
      <div class="totals__grand"><dt>Total</dt><dd>${num(money(q.total))}</dd></div><div><dt>Deposit to hold the slot</dt><dd>${num(money(q.deposit))}</dd></div></dl>`;
}

export function stepper(d) {
  return `<ol class="stepper" aria-label="Booking steps">${STEPS.map((n, i) => `<li class="${d.step === i + 1 ? 'is-current' : d.step > i + 1 ? 'is-done' : ''}"${d.step === i + 1 ? ' aria-current="step"' : ''}><span class="stepper__n">${d.step > i + 1 ? ic('check') : i + 1}</span><span class="stepper__t">${n}</span></li>`).join('')}</ol>`;
}

export function stepHtml(d) {
  if (d.done) return doneHtml(d.done);
  let body = '';
  if (d.step === 1) {
    body = `<fieldset class="choices"><legend class="h2">Choose a studio</legend>${STUDIOS.map((s) => `
      <label class="choice"><input type="radio" name="studio" value="${s.id}" ${d.studio === s.id ? 'checked' : ''}>${thumb(s, 'choice__img')}
        <span class="choice__body"><b>${esc(s.name)}</b><span class="meta">${esc(s.cap)}</span><span class="meta">${esc(s.text)}</span><span class="choice__rate">${num('$' + s.rate)}<small>/ hour</small></span></span></label>`).join('')}</fieldset>`;
  } else if (d.step === 2) {
    const min = toIso(new Date()), max = toIso(addDays(180));
    body = `<h2 class="h2">Date and time</h2>
      <div class="form-grid form-grid--2">
        <div class="field"><label for="b-date">Date</label><input id="b-date" class="input" type="date" name="date" min="${min}" max="${max}" value="${d.date}"></div>
        <div class="field"><label for="b-hours">Duration: <b>${num(d.hours)}</b> <span>hours</span></label><input id="b-hours" class="range" type="range" name="hours" min="2" max="12" step="1" value="${d.hours}"></div>
      </div>
      <p class="meta">Studio hours <bdi class="num">${hh(OPEN)} - ${hh(CLOSE)}</bdi>. Pick a start time.</p>
      <div id="slots" aria-live="polite">${slotsHtml(d)}</div>`;
  } else if (d.step === 3) {
    body = `<h2 class="h2">Crew, services and equipment</h2>
      <fieldset class="opts"><legend>Crew and services <small class="meta">(per hour)</small></legend>${ADDONS.map((a) => `<label class="check"><input type="checkbox" name="addon" value="${a.id}" ${d.addons.includes(a.id) ? 'checked' : ''}><span>${a.name}</span><small>+${num('$' + a.rate)}/h</small></label>`).join('')}</fieldset>
      <fieldset class="opts"><legend>Equipment and extras <small class="meta">(per booking)</small></legend>${GEAR.map((g) => `<label class="check"><input type="checkbox" name="gear" value="${g.id}" ${d.gear.includes(g.id) ? 'checked' : ''}><span>${g.name}</span><small>+${num('$' + g.price)}</small></label>`).join('')}</fieldset>`;
  } else {
    const s = studioOf(d.studio);
    body = `<h2 class="h2">Review your booking</h2>
      <dl class="kv"><div><dt>Studio</dt><dd>${esc(s.name)}</dd></div><div><dt>Date</dt><dd>${num(esc(fmtLong(d.date)))}</dd></div><div><dt>Time</dt><dd>${range({ start: d.start, hours: d.hours })} <span class="meta">(${num(d.hours)} <span>hours</span>)</span></dd></div>
      <div><dt>Crew and services</dt><dd>${d.addons.length ? ADDONS.filter((a) => d.addons.includes(a.id)).map((a) => `<span class="tagline">${a.name}</span>`).join('') : '<span class="meta">None</span>'}</dd></div>
      <div><dt>Equipment</dt><dd>${d.gear.length ? GEAR.filter((g) => d.gear.includes(g.id)).map((g) => `<span class="tagline">${g.name}</span>`).join('') : '<span class="meta">None</span>'}</dd></div></dl>
      <label class="check check--terms"><input type="checkbox" name="agree" ${d.agree ? 'checked' : ''}><span>I agree to the booking terms. A ${num(DEPOSIT * 100 + '%')} deposit holds the slot, and bookings can be cancelled free of charge up to 48 hours before they start.</span></label>`;
  }
  const last = d.step === 4;
  return `${body}<p class="form-note" id="step-error" role="alert" hidden></p>
    <div class="step-nav">${d.step > 1 ? '<button type="button" class="btn btn-ghost" data-action="prev"><span>Back</span></button>' : '<span></span>'}
    <button type="button" class="btn" data-action="${last ? 'confirm' : 'next'}"><span>${last ? 'Confirm booking' : 'Continue'}</span>${last ? '' : '<span class="ico" data-icon="arrow"></span>'}</button></div>`;
}

export function doneHtml({ bk, iv }) {
  const s = studioOf(bk.studio);
  return `<div class="done"><span class="done__icon">${ic('check')}</span><h2 class="h2">Booking confirmed</h2>
    <p class="lead"><span>${esc(s.name)}</span> &middot; ${num(esc(fmtDate(bk.date)))} &middot; ${range(bk)}</p>
    <p class="meta"><span>Booking</span> ${num(bk.id)} &middot; <span>Invoice</span> ${num(iv.id)}</p>
    <div class="cta-row cta-row--center"><a class="btn" href="#/bookings"><span>View my bookings</span></a><button type="button" class="btn btn-ghost" data-action="again"><span>Book another session</span></button></div></div>`;
}

export function book(d) {
  return `
  <header class="view-head"><div><p class="eyebrow">New booking</p><h1>Book a studio</h1><p class="lead">Choose a room, pick a time and see the price as you go.</p></div></header>
  <div class="book">
    <div class="book__main">${d.done ? '' : `<div id="stepper">${stepper(d)}</div>`}<section class="panel panel--pad" id="step" tabindex="-1">${stepHtml(d)}</section></div>
    <aside class="panel panel--pad summary" id="summary" aria-label="Booking summary">${summary(d)}</aside>
  </div>`;
}

/* ================= My bookings ================= */
export function bookings(tab) {
  const s = load();
  const groups = { upcoming: [], completed: [], cancelled: [] };
  s.bookings.forEach((b) => groups[categoryOf(b)].push(b));
  groups.upcoming.sort((a, b) => startOf(a) - startOf(b));
  groups.completed.sort((a, b) => startOf(b) - startOf(a));
  groups.cancelled.sort((a, b) => startOf(b) - startOf(a));
  const labels = { upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };
  const rows = groups[tab].map((b) => {
    const st = studioOf(b.studio);
    return `<li class="bk">${thumb(st)}<div class="bk__what"><h3>${esc(st.name)}</h3><p class="meta">${num(esc(b.id))}</p></div>
      <div class="bk__when"><b>${num(esc(fmtDate(b.date)))}</b><span class="meta">${range(b)}</span></div>
      <div class="bk__status">${chip(tab === 'upcoming' ? 'confirmed' : tab)}</div><b class="bk__total">${num(money(totalOf(b)))}</b>
      <button type="button" class="btn btn-ghost btn-sm" data-action="details" data-id="${b.id}"><span>Details</span></button></li>`;
  }).join('');
  const empty = { upcoming: ['You have no upcoming sessions.', true], completed: ['Completed sessions will appear here.'], cancelled: ['You have not cancelled any bookings.'] }[tab];
  return `
  <header class="view-head"><div><p class="eyebrow">Sessions</p><h1>My bookings</h1><p class="lead">Review, manage and cancel your studio sessions.</p></div><a class="btn" href="#/book"><span class="ico" data-icon="plus"></span><span>Book a studio</span></a></header>
  <div class="tabs-bar" role="tablist" aria-label="Booking status">${Object.keys(labels).map((k) => `<button type="button" role="tab" class="tabbtn" id="t-${k}" aria-selected="${k === tab}" tabindex="${k === tab ? 0 : -1}" data-tab="${k}"><span>${labels[k]}</span><span class="count">${groups[k].length}</span></button>`).join('')}</div>
  <section class="panel" role="tabpanel" aria-labelledby="t-${tab}">${rows ? `<ul class="list">${rows}</ul>` : `<div class="empty"><p>${empty[0]}</p>${empty[1] ? '<a class="btn btn-ghost" href="#/book"><span>Book a studio</span></a>' : ''}</div>`}</section>`;
}

export function detailsDialog(id) {
  const b = load().bookings.find((x) => x.id === id); if (!b) return '';
  const st = studioOf(b.studio), cat = categoryOf(b), q = quote(b), iv = invFor(id);
  return `<div class="dlg__head"><div><p class="eyebrow">Booking ${num(esc(b.id))}</p><h2>${esc(st.name)}</h2></div>${chip(cat === 'upcoming' ? 'confirmed' : cat)}</div>
  <div class="dlg__body">
    <dl class="kv"><div><dt>Date</dt><dd>${num(esc(fmtLong(b.date)))}</dd></div><div><dt>Time</dt><dd>${range(b)} <span class="meta">(${num(b.hours)} <span>hours</span>)</span></dd></div>
    <div><dt>Crew and services</dt><dd>${b.addons.length ? ADDONS.filter((a) => b.addons.includes(a.id)).map((a) => `<span class="tagline">${a.name}</span>`).join('') : '<span class="meta">None</span>'}</dd></div>
    <div><dt>Equipment</dt><dd>${b.gear.length ? GEAR.filter((g) => b.gear.includes(g.id)).map((g) => `<span class="tagline">${g.name}</span>`).join('') : '<span class="meta">None</span>'}</dd></div>
    <div><dt>Invoice</dt><dd>${iv ? `${num(esc(iv.id))} ${chip(iv.status)}` : '-'}</dd></div></dl>
    <dl class="totals"><div><dt>Subtotal</dt><dd>${num(money(q.subtotal))}</dd></div><div><dt>Tax</dt><dd>${num(money(q.tax))}</dd></div><div class="totals__grand"><dt>Total</dt><dd>${num(money(q.total))}</dd></div></dl>
  </div>
  <div class="dlg__foot"><button type="button" class="btn btn-ghost" data-close><span>Close</span></button>${cat === 'upcoming' ? `<button type="button" class="btn btn-danger" data-action="cancel-ask" data-id="${b.id}"><span>Cancel booking</span></button>` : ''}</div>`;
}

export function cancelDialog(id) {
  const b = load().bookings.find((x) => x.id === id);
  const hrs = (startOf(b) - new Date()) / 36e5;
  const q = quote(b);
  return `<div class="dlg__head"><div><p class="eyebrow">Booking ${num(esc(b.id))}</p><h2>Cancel this booking?</h2></div></div>
  <div class="dlg__body"><p><span>${esc(studioOf(b.studio).name)}</span> &middot; ${num(esc(fmtDate(b.date)))} &middot; ${range(b)}</p>
    <p class="form-note form-note--info">${hrs >= 48 ? 'Free cancellation applies. The slot is released and the invoice is voided.' : `<span>Inside 48 hours, the deposit is retained:</span> ${num(money(q.deposit))}`}</p></div>
  <div class="dlg__foot"><button type="button" class="btn btn-ghost" data-close><span>Keep booking</span></button><button type="button" class="btn btn-danger" data-action="cancel-do" data-id="${b.id}"><span>Yes, cancel booking</span></button></div>`;
}

/* ================= Invoices ================= */
export function invoices() {
  const s = load();
  const rows = s.invoices.map((i) => ({ i, b: s.bookings.find((b) => b.id === i.booking) })).sort((a, b) => (a.i.issued < b.i.issued ? 1 : -1));
  const sum = (st) => rows.filter((r) => r.i.status === st).reduce((t, r) => t + totalOf(r.b), 0);
  const btn = (act, icon, label, id) => `<button type="button" class="icon-btn" data-action="${act}" data-id="${id}" aria-label="${label}" title="${label}"><span class="ico" data-icon="${icon}"></span></button>`;
  return `
  <header class="view-head"><div><p class="eyebrow">Billing</p><h1>Invoices</h1><p class="lead">View, print or download an invoice for any booking.</p></div></header>
  <section class="metrics metrics--2" aria-label="Billing summary">
    <div class="meter"><p class="meter__label">Outstanding</p><p class="meter__value">${num(money(sum('due')))}</p><p class="meter__sub"><span>Awaiting payment</span></p></div>
    <div class="meter"><p class="meter__label">Paid to date</p><p class="meter__value">${num(money(sum('paid')))}</p><p class="meter__sub"><span>Settled invoices</span></p></div>
  </section>
  <section class="panel"><ul class="list">${rows.map(({ i, b }) => `<li class="inv"><div class="inv__id"><h3>${num(esc(i.id))}</h3><p class="meta">${num(esc(b.id))} &middot; <span>${esc(studioOf(b.studio).name)}</span></p></div>
    <div class="inv__dates"><p class="meta"><span>Issued</span> ${num(esc(fmtShort(i.issued)))}</p><p class="meta"><span>Due</span> ${num(esc(fmtShort(i.due)))}</p></div>
    <div class="bk__status">${chip(i.status)}</div><b class="bk__total">${num(money(totalOf(b)))}</b>
    <div class="inv__actions">${btn('inv-view', 'fileText', 'View invoice', i.id)}${btn('inv-print', 'printer', 'Print invoice', i.id)}${btn('inv-dl', 'download', 'Download invoice', i.id)}</div></li>`).join('')}</ul></section>`;
}

export function invoiceDoc(id) {
  const s = load(); const i = s.invoices.find((x) => x.id === id); const b = s.bookings.find((x) => x.id === i.booking);
  const q = quote(b), p = s.profile, st = studioOf(b.studio);
  return `<article class="doc">
    <header class="doc__head"><div><p class="doc__brand">Signalroom Studios</p><address>${contact.address.map((l) => `<span class="block">${l}</span>`).join('')}<span class="block"><bdi class="num">${contact.phone}</bdi></span><span class="block">${contact.email}</span></address></div>
      <div class="doc__id"><h2>Invoice</h2><p>${num(esc(i.id))}</p>${chip(i.status)}</div></header>
    <div class="doc__parties"><div><h3>Bill to</h3><p><b>${esc(p.name)}</b></p><p>${esc(p.company)}</p><p>${esc(p.email)}</p></div>
      <div><h3>Details</h3><p><span>Issued</span> ${num(esc(fmtShort(i.issued)))}</p><p><span>Due</span> ${num(esc(fmtShort(i.due)))}</p><p><span>Booking</span> ${num(esc(b.id))}</p></div></div>
    <table class="doc__table"><thead><tr><th scope="col">Description</th><th scope="col">Detail</th><th scope="col">Amount</th></tr></thead>
      <tbody>${q.lines.map((l) => `<tr><td>${l.name}${l.key === 'studio' ? ` <span class="meta">${num(esc(fmtDate(b.date)))} ${range(b)}</span>` : ''}</td><td>${num(esc(l.detail || '-'))}</td><td>${num(money(l.amount))}</td></tr>`).join('')}</tbody></table>
    <dl class="totals"><div><dt>Subtotal</dt><dd>${num(money(q.subtotal))}</dd></div><div><dt>Tax <small>${num((TAX * 100).toFixed(2) + '%')}</small></dt><dd>${num(money(q.tax))}</dd></div><div class="totals__grand"><dt>Total</dt><dd>${num(money(q.total))}</dd></div></dl>
    <p class="doc__note">${i.status === 'paid' ? 'Paid in full. Thank you for booking with Signalroom Studios.' : i.status === 'void' ? 'This invoice was voided when the booking was cancelled.' : 'Payment is due on the session date. Thank you for booking with Signalroom Studios.'}</p>
    <p class="meta">${esc(st.name)}</p></article>`;
}
export const invoiceDialog = (id) => `<div class="dlg__body dlg__body--doc">${invoiceDoc(id)}</div>
  <div class="dlg__foot"><button type="button" class="btn btn-ghost" data-close><span>Close</span></button><button type="button" class="btn btn-ghost" data-action="inv-dl" data-id="${id}"><span class="ico" data-icon="download"></span><span>Download</span></button><button type="button" class="btn" data-action="inv-print" data-id="${id}"><span class="ico" data-icon="printer"></span><span>Print</span></button></div>`;

/* ================= Profile & settings ================= */
export function profile(theme, dirv) {
  const s = load(), p = s.profile, pr = s.prefs;
  const initials = p.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const seg = (name, val, items) => `<div class="seg" role="radiogroup">${items.map(([v, label]) => `<label class="seg__opt"><input type="radio" name="${name}" value="${v}" ${val === v ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div>`;
  const sw = (name, label, on) => `<label class="switch"><span>${label}</span><input type="checkbox" role="switch" name="${name}" ${on ? 'checked' : ''}><i></i></label>`;
  return `
  <header class="view-head"><div><p class="eyebrow">Account</p><h1>Profile and settings</h1><p class="lead">Keep your details current and set how the portal looks.</p></div></header>
  <div class="settings">
    <section class="panel panel--pad" aria-labelledby="pf-h"><h2 class="h2" id="pf-h">Profile</h2>
      <form data-form="profile" novalidate class="form-grid">
        <div class="ava-row"><span class="ava" aria-hidden="true">${esc(initials)}</span><div><b>${esc(p.name)}</b><p class="meta">${esc(p.company)}</p></div></div>
        <div class="form-grid form-grid--2">
          <div class="field"><label for="p-name">Full name</label><input id="p-name" name="name" class="input" value="${esc(p.name)}" autocomplete="name"><p class="field__error" data-error="name"></p></div>
          <div class="field"><label for="p-company">Company</label><input id="p-company" name="company" class="input" value="${esc(p.company)}" autocomplete="organization"></div>
          <div class="field"><label for="p-email">Email</label><input id="p-email" name="email" type="email" class="input" value="${esc(p.email)}" autocomplete="email"><p class="field__error" data-error="email"></p></div>
          <div class="field"><label for="p-phone">Phone</label><input id="p-phone" name="phone" type="tel" class="input" value="${esc(p.phone)}" autocomplete="tel"></div>
          <div class="field span-2"><label for="p-zone">Time zone</label><select id="p-zone" name="zone" class="input select">${['Central Time (US and Canada)', 'Eastern Time (US and Canada)', 'Pacific Time (US and Canada)', 'Greenwich Mean Time', 'Gulf Standard Time'].map((z) => `<option ${z === p.zone ? 'selected' : ''}>${z}</option>`).join('')}</select></div>
        </div>
        <div><button class="btn" type="submit"><span>Save profile</span></button></div></form></section>
    <section class="panel panel--pad" aria-labelledby="pw-h"><h2 class="h2" id="pw-h">Password</h2>
      <form data-form="password" novalidate class="form-grid">
        ${['current:Current password', 'next:New password', 'confirm:Confirm new password'].map((x) => { const [n, l] = x.split(':'); return `<div class="field"><label for="w-${n}">${l}</label><input id="w-${n}" name="${n}" type="password" class="input" autocomplete="${n === 'current' ? 'current-password' : 'new-password'}"><p class="field__error" data-error="${n}"></p></div>`; }).join('')}
        <div class="strength" aria-live="polite"><span class="strength__bar" data-strength="0"><i></i><i></i><i></i><i></i></span><span class="meta" data-strength-label>Use 8 or more characters with a mix of letters and numbers.</span></div>
        <div><button class="btn" type="submit"><span>Update password</span></button></div></form></section>
    <section class="panel panel--pad span-all" aria-labelledby="pref-h"><h2 class="h2" id="pref-h">Preferences</h2>
      <div class="pref-grid">
        <div class="field"><span class="lbl">Theme</span>${seg('theme', theme, [['light', 'Light'], ['dark', 'Dark']])}</div>
        <div class="field"><span class="lbl">Direction</span>${seg('dir', dirv, [['ltr', 'Left to right'], ['rtl', 'Right to left']])}</div>
        <form data-form="prefs" class="switches">${sw('reminders', 'Session reminders by email', pr.reminders)}${sw('invoices', 'Email me new invoices', pr.invoices)}${sw('tips', 'Studio news and offers', pr.tips)}</form>
      </div></section>
  </div>`;
}
