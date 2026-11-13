import { contact } from '../data.js';
import { hydrateIcons } from './icons.js';

// Page-agnostic widgets: each is a no-op when its markup is absent.

export function initContact() {
  document.querySelectorAll('[data-contact]').forEach((el) => {
    const k = el.dataset.contact;
    if (k === 'phone') { el.textContent = contact.phone; el.setAttribute('href', contact.phoneHref); el.setAttribute('dir', 'ltr'); }
    if (k === 'address') el.innerHTML = contact.address.map((l) => `<span class="block">${l}</span>`).join('');
    if (k === 'hours') el.textContent = contact.hours;
    if (k === 'email') { el.textContent = contact.email; el.setAttribute('href', 'mailto:' + contact.email); }
  });
}

export function initIcons() { hydrateIcons(); }

// Accessible tabs (arrow keys, Home/End).
export function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach((box) => {
    const tabs = [...box.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const rtl = document.documentElement.dir === 'rtl';
        const next = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (next) { e.preventDefault(); select((i + next + tabs.length) % tabs.length, true); }
        if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    select(0);
  });
}

// Session cost estimator (illustrative rates).
export function initEstimator() {
  const form = document.querySelector('[data-estimator]');
  if (!form) return;
  const money = (n) => '$' + n.toLocaleString('en-US');
  const hours = form.querySelector('[name="hours"]');
  const studio = form.querySelector('[name="studio"]');
  const update = () => {
    const h = Number(hours.value);
    const base = Number(studio.selectedOptions[0].dataset.rate) * h;
    let total = base;
    form.querySelector('[data-out="hours"]').textContent = h;
    form.querySelector('[data-out="base"]').textContent = money(base);
    form.querySelectorAll('[data-addon]').forEach((box) => {
      const line = form.querySelector(`[data-line="${box.dataset.addon}"]`);
      const cost = Number(box.dataset.rate) * h;
      line.hidden = !box.checked;
      line.querySelector('[data-out="cost"]').textContent = money(cost);
      if (box.checked) total += cost;
    });
    form.querySelector('[data-out="total"]').textContent = money(total);
  };
  form.addEventListener('input', update);
  update();
}

// Timecode readout (HH:MM:SS) for monitor overlays.
export function initClock() {
  const els = document.querySelectorAll('[data-clock]');
  if (!els.length) return;
  const tick = () => {
    const d = new Date();
    const v = [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
    els.forEach((el) => { el.textContent = v; });
  };
  tick();
  setInterval(tick, 1000);
}
