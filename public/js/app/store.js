// Client-portal data layer: records, pricing, availability and localStorage persistence (frontend only).
const KEY = 'sr-app-v1';
const SESSION = 'sr-session';
export const TAX = 0.0825;
export const DEPOSIT = 0.25;
export const OPEN = 7;   // first bookable hour
export const CLOSE = 23; // studio closes

export const STUDIOS = [
  { id: 'talk', name: 'Talk Suite', rate: 95, cap: 'Up to 4 guests', img: 'app-talk', alt: 'Podcast mixer with illuminated faders and pads', text: 'Round-table podcasts and panels.' },
  { id: 'cyclorama', name: 'Cyclorama Stage', rate: 110, cap: 'Up to 25 people', img: 'app-cyclo', alt: 'Black lighting stand on a wooden studio floor', text: 'A white cove for launches and shoots.' },
  { id: 'chroma', name: 'Chroma Room', rate: 105, cap: 'Up to 10 people', img: 'app-chroma', alt: 'Softbox being fitted onto a studio light', text: 'Keyed backdrop and virtual sets.' },
  { id: 'audio', name: 'Audio Suite', rate: 85, cap: 'Up to 6 people', img: 'app-audio', alt: 'Recording desk with a mixing console, keyboard and monitor', text: 'Mix room and voice-over booth.' },
];
export const ADDONS = [
  { id: 'eng', name: 'Studio engineer', rate: 45 },
  { id: 'crew', name: 'Multicamera crew', rate: 60 },
  { id: 'stream', name: 'Live stream encoding', rate: 40 },
  { id: 'prompt', name: 'Teleprompter and graphics', rate: 25 },
];
export const GEAR = [
  { id: 'wmic', name: 'Wireless microphone kit', price: 35 },
  { id: 'light', name: 'Extra lighting package', price: 60 },
  { id: 'iso', name: 'ISO recording pack', price: 50 },
  { id: 'green', name: 'Green room hospitality', price: 40 },
];
export const studioOf = (id) => STUDIOS.find((s) => s.id === id);

/* ---------- dates ---------- */
const pad = (n) => String(n).padStart(2, '0');
export const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (n, from = new Date()) => { const d = new Date(from.getFullYear(), from.getMonth(), from.getDate()); d.setDate(d.getDate() + n); return d; };
export const hh = (h) => `${pad(h)}:00`;
export const endOf = (b) => { const d = fromIso(b.date); d.setHours(b.start + b.hours, 0, 0, 0); return d; };
export const startOf = (b) => { const d = fromIso(b.date); d.setHours(b.start, 0, 0, 0); return d; };

/* ---------- pricing ---------- */
export function quote({ studio, hours, addons = [], gear = [] }) {
  const s = studioOf(studio);
  const lines = [];
  if (s) lines.push({ key: 'studio', name: s.name, detail: `${hours} h x $${s.rate}`, amount: s.rate * hours });
  ADDONS.filter((a) => addons.includes(a.id)).forEach((a) => lines.push({ key: a.id, name: a.name, detail: `${hours} h x $${a.rate}`, amount: a.rate * hours }));
  GEAR.filter((g) => gear.includes(g.id)).forEach((g) => lines.push({ key: g.id, name: g.name, detail: '', amount: g.price }));
  const subtotal = lines.reduce((t, l) => t + l.amount, 0);
  const tax = Math.round(subtotal * TAX * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { lines, subtotal, tax, total, deposit: Math.round(total * DEPOSIT * 100) / 100 };
}
export const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------- availability (sample slots, deterministic per studio + date) ---------- */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function takenHours(studio, date, bookings, ignoreId) {
  const taken = new Set();
  let seed = 7; for (const c of studio + date) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const r = rng(seed);
  for (let h = OPEN; h < CLOSE; h++) { if (r() < 0.16) { const len = 2 + Math.floor(r() * 2); for (let k = 0; k < len; k++) taken.add(h + k); h += len; } }
  bookings.filter((b) => b.status !== 'cancelled' && b.studio === studio && b.date === date && b.id !== ignoreId)
    .forEach((b) => { for (let h = b.start; h < b.start + b.hours; h++) taken.add(h); });
  if (date === toIso(new Date())) { const now = new Date().getHours(); for (let h = OPEN; h <= now; h++) taken.add(h); }
  return taken;
}
export const slotFits = (taken, start, hours) => { if (start < OPEN || start + hours > CLOSE) return false; for (let h = start; h < start + hours; h++) if (taken.has(h)) return false; return true; };

/* ---------- state ---------- */
const nowIso = () => new Date().toISOString();
function seed() {
  const b = (id, studio, off, start, hours, addons, gear, status = 'confirmed') => ({ id, studio, date: toIso(addDays(off)), start, hours, addons, gear, status, created: toIso(addDays(off - 9)) });
  const bookings = [
    b('BK-2041', 'talk', 3, 14, 4, ['eng', 'stream'], ['wmic']),
    b('BK-2042', 'cyclorama', 12, 9, 8, ['eng', 'crew'], ['light']),
    b('BK-2033', 'audio', -9, 10, 3, ['eng'], []),
    b('BK-2029', 'talk', -27, 13, 2, ['eng', 'prompt'], ['iso']),
    b('BK-2024', 'chroma', -18, 15, 4, ['eng'], [], 'cancelled'),
  ];
  const inv = (id, booking, status) => { const bk = bookings.find((x) => x.id === booking); return { id, booking, status, issued: toIso(addDays(-3, fromIso(bk.date))), due: bk.date }; };
  const invoices = [inv('INV-3118', 'BK-2042', 'due'), inv('INV-3117', 'BK-2041', 'due'), inv('INV-3109', 'BK-2033', 'paid'), inv('INV-3102', 'BK-2029', 'paid'), inv('INV-3098', 'BK-2024', 'void')];
  return {
    bookings, invoices,
    profile: { name: 'Alex Morgan', company: 'Northlight Media', email: 'alex@northlight.media', phone: '+1 (512) 555-0173', zone: 'Central Time (US and Canada)' },
    prefs: { reminders: true, invoices: true, tips: false },
    activity: [
      { type: 'booked', ref: 'BK-2042', at: addDays(-2).toISOString() },
      { type: 'invoice', ref: 'INV-3117', at: addDays(-6).toISOString() },
      { type: 'booked', ref: 'BK-2041', at: addDays(-6).toISOString() },
      { type: 'completed', ref: 'BK-2033', at: addDays(-9).toISOString() },
    ],
    seq: { bk: 2042, inv: 3118 },
  };
}
let state;
export function load() {
  if (state) return state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch { state = null; }
  if (!state || !state.bookings) { state = seed(); save(); }
  return state;
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
export const log = (type, ref) => { state.activity.unshift({ type, ref, at: nowIso() }); state.activity = state.activity.slice(0, 20); };

export function createBooking(d) {
  const s = load();
  const bk = { id: 'BK-' + (++s.seq.bk), studio: d.studio, date: d.date, start: d.start, hours: d.hours, addons: [...d.addons], gear: [...d.gear], status: 'confirmed', created: toIso(new Date()) };
  const iv = { id: 'INV-' + (++s.seq.inv), booking: bk.id, status: 'due', issued: toIso(new Date()), due: bk.date };
  s.bookings.unshift(bk); s.invoices.unshift(iv); log('booked', bk.id); save();
  return { bk, iv };
}
export function cancelBooking(id) {
  const s = load();
  const bk = s.bookings.find((b) => b.id === id); if (!bk) return;
  bk.status = 'cancelled';
  s.invoices.filter((i) => i.booking === id).forEach((i) => { i.status = 'void'; });
  log('cancelled', id); save();
}
export const categoryOf = (b) => (b.status === 'cancelled' ? 'cancelled' : endOf(b) < new Date() ? 'completed' : 'upcoming');

/* ---------- session (frontend only) ---------- */
export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION)); } catch { return null; }
}
export function startSession({ email, remember, method }) {
  const data = JSON.stringify({ email, method, at: nowIso() });
  try { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); (remember ? localStorage : sessionStorage).setItem(SESSION, data); } catch {}
  const s = load(); if (email) { s.profile.email = email; save(); }
}
export function endSession() { try { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); } catch {} }
export const REMEMBER = 'sr-remember';
