import { contact } from '../data.js';
import { tr } from './direction.js';

// Enquiry form: validation, prefill from ?studio=&date=&hours=, hand-off to the visitor's email app.
export function initForm() {
  const form = document.querySelector('[data-enquiry]');
  if (!form) return;
  const status = form.querySelector('[data-status]');
  const q = new URLSearchParams(location.search);
  const f = (n) => form.elements[n];

  if (q.get('studio') && [...f('studio').options].some((o) => o.value === q.get('studio'))) f('studio').value = q.get('studio');
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.get('date') || '')) f('date').value = q.get('date');
  const hrs = parseInt(q.get('hours'), 10);
  if (hrs > 0 && hrs <= 24) f('message').value = `${hrs} h`;
  f('date').min = new Date().toISOString().slice(0, 10);

  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please enter your name.' : ''),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'),
    message: (v) => (v.trim().length < 10 ? 'Please tell us a little about your show (10+ characters).' : ''),
  };
  const check = (name) => {
    const el = f(name);
    const msg = rules[name] ? rules[name](el.value) : '';
    const err = form.querySelector(`[data-error="${name}"]`);
    err.textContent = msg ? tr(msg) : '';
    err.dataset.key = msg;
    el.setAttribute('aria-invalid', String(Boolean(msg)));
    return !msg;
  };
  Object.keys(rules).forEach((n) => f(n).addEventListener('blur', () => check(n)));
  document.addEventListener('dirchange', () => form.querySelectorAll('[data-error]').forEach((e) => { if (e.dataset.key) e.textContent = tr(e.dataset.key); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = Object.keys(rules).filter((n) => !check(n));
    if (bad.length) { status.hidden = true; f(bad[0]).focus(); return; }
    const studio = f('studio').selectedOptions[0].textContent;
    const body = [`Name: ${f('name').value}`, `Email: ${f('email').value}`, `Phone: ${f('phone').value || '-'}`, `Studio: ${studio}`, `Date: ${f('date').value || '-'}`, '', f('message').value].join('\n');
    const href = `mailto:${contact.email}?subject=${encodeURIComponent('Studio enquiry - ' + studio)}&body=${encodeURIComponent(body)}`;
    status.hidden = false;
    status.textContent = tr('Your email app should open with your enquiry ready to send. If it does not, write to us directly at') + ' ' + contact.email;
    status.dataset.key = 'sent';
    location.href = href;
  });
}
