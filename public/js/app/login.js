import { initApp } from '../app-shell.js';
import { icons, hydrateIcons } from '../modules/icons.js';
import { tr } from '../modules/direction.js';
import { getSession, startSession, REMEMBER, load } from './store.js';

if (getSession()) location.replace('dashboard.html');

const $ = (s) => document.querySelector(s);
const signin = $('#view-signin'), forgot = $('#view-forgot');
const form = $('#signin'), reset = $('#reset');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const note = (el, msg, type) => { el.className = 'form-note' + (type ? ` form-note--${type}` : ''); el.hidden = !msg; el.textContent = msg ? tr(msg) : ''; el.dataset.key = msg || ''; };
const fieldErr = (f, name, msg) => { const e = f.querySelector(`[data-error="${name}"]`); e.textContent = msg ? tr(msg) : ''; e.dataset.key = msg || ''; f.elements[name].setAttribute('aria-invalid', String(Boolean(msg))); return !msg; };
const busy = (btn, on, label) => { btn.disabled = on; btn.classList.toggle('is-loading', on); if (label) btn.querySelector('.btn__t').textContent = tr(label); btn.setAttribute('aria-busy', String(on)); };

// Remembered email
try { const r = localStorage.getItem(REMEMBER); if (r) { form.elements.email.value = r; form.elements.remember.checked = true; } } catch {}

// Show / hide password
$('[data-toggle-pw]').addEventListener('click', (e) => {
  const btn = e.currentTarget, pw = form.elements.password, show = pw.type === 'password';
  pw.type = show ? 'text' : 'password';
  btn.setAttribute('aria-pressed', String(show));
  const label = show ? 'Hide password' : 'Show password';
  btn.setAttribute('data-en-aria-label', label); btn.setAttribute('aria-label', tr(label));
  btn.innerHTML = show ? icons.eyeOff : icons.eye;
});

const go = (url) => setTimeout(() => location.assign(url), 700);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = form.elements.email.value.trim(), pw = form.elements.password.value;
  note($('#msg'), '');
  const ok = [fieldErr(form, 'email', EMAIL.test(email) ? '' : 'Enter a valid email address.'), fieldErr(form, 'password', pw.length >= 8 ? '' : 'Password must be at least 8 characters.')];
  if (ok.includes(false)) { note($('#msg'), 'Please check the highlighted fields and try again.', 'error'); form.querySelector('[aria-invalid="true"]').focus(); return; }
  const btn = $('#signin-btn'); busy(btn, true, 'Signing in...');
  setTimeout(() => {
    try { form.elements.remember.checked ? localStorage.setItem(REMEMBER, email) : localStorage.removeItem(REMEMBER); } catch {}
    startSession({ email, remember: form.elements.remember.checked, method: 'password' });
    note($('#msg'), 'Signed in. Taking you to your dashboard...', 'ok'); busy(btn, false, 'Signed in'); btn.disabled = true;
    go('dashboard.html');
  }, 900);
});

// Clear field errors as the user types
form.addEventListener('input', (e) => { if (e.target.name === 'email' || e.target.name === 'password') fieldErr(form, e.target.name, ''); });

// Google sign-in
$('#google').addEventListener('click', (e) => {
  const btn = e.currentTarget; note($('#msg'), ''); busy(btn, true, 'Connecting to Google...');
  setTimeout(() => {
    startSession({ email: load().profile.email, remember: form.elements.remember.checked, method: 'google' });
    note($('#msg'), 'Signed in with Google. Taking you to your dashboard...', 'ok'); go('dashboard.html');
  }, 900);
});

// Forgot password
const swap = (toForgot) => {
  signin.hidden = toForgot; forgot.hidden = !toForgot;
  note($('#rmsg'), ''); note($('#msg'), '');
  if (toForgot) { reset.elements.email.value = form.elements.email.value; reset.elements.email.focus(); } else form.elements.email.focus();
};
$('[data-forgot]').addEventListener('click', () => swap(true));
$('[data-back]').addEventListener('click', () => swap(false));
reset.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = reset.elements.email.value.trim();
  note($('#rmsg'), '');
  if (!fieldErr(reset, 'email', EMAIL.test(email) ? '' : 'Enter a valid email address.')) { reset.elements.email.focus(); return; }
  const btn = $('#reset-btn'); busy(btn, true, 'Sending...');
  setTimeout(() => {
    busy(btn, false, 'Send reset link');
    note($('#rmsg'), 'If an account exists for this email, a reset link is on its way.', 'ok');
    $('#rmsg').insertAdjacentHTML('beforeend', ` <bdi class="num">${email.replace(/[<>&"]/g, '')}</bdi>`);
  }, 900);
});
document.addEventListener('dirchange', () => document.querySelectorAll('[data-key]').forEach((el) => { if (el.dataset.key && !el.querySelector('bdi')) el.textContent = tr(el.dataset.key); }));

hydrateIcons();
$('[data-toggle-pw]').innerHTML = icons.eye;
initApp();
