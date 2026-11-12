import { brand, nav, cta, login, contact, social, studios } from '../data.js';
import { icons } from './icons.js';

const strip = (p) => p.replace(/\.html$/, '');
const page = strip(location.pathname.split('/').pop() || 'index');
const cur = (href) => (strip(href) === page ? ' aria-current="page"' : '');
const plain = (n) => `<a href="${n.href}"${cur(n.href)}>${n.label}</a>`;
const homeActive = nav[0].children.some((c) => strip(c.href) === page);

const desktopItem = (n) => n.children
  ? `<div class="dropdown" data-dropdown>
      <button type="button" class="dropdown__btn" aria-expanded="false" aria-haspopup="true" aria-controls="dd-home"${homeActive ? ' data-active' : ''}>
        <span>${n.label}</span><span class="dropdown__chev">${icons.chevron}</span></button>
      <div class="dropdown__panel" id="dd-home" hidden>${n.children.map(plain).join('')}</div></div>`
  : plain(n);

const mobileItem = (n) => n.children
  ? `<div data-dropdown class="m-acc">
      <button type="button" class="dropdown__btn" aria-expanded="false" aria-controls="m-home"${homeActive ? ' data-active' : ''}>
        <span>${n.label}</span><span class="dropdown__chev">${icons.chevron}</span></button>
      <div class="m-acc__panel" id="m-home" hidden>${n.children.map(plain).join('')}</div></div>`
  : plain(n);

const contactRow = (icon, inner) => `<li class="contact-row"><span class="contact-row__icon">${icons[icon]}</span><span>${inner}</span></li>`;

export function renderLayout() {
  const header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = `
    <div class="site-header"><div class="container-studio site-header__bar">
      <a class="brand" href="index.html" aria-label="${brand.name} ${brand.suffix}">${icons.logo}<span>${brand.name}<span class="brand__suffix"> ${brand.suffix}</span></span></a>
      <nav class="nav-desktop" aria-label="Primary">${nav.map(desktopItem).join('')}</nav>
      <div class="header-actions">
        <button type="button" class="icon-btn max-lg:hidden" data-theme-toggle></button>
        <button type="button" class="icon-btn max-lg:hidden" data-dir-toggle></button>
        <a class="btn btn-sm max-lg:hidden" href="${login.href}">${login.label}</a>
        <button type="button" class="icon-btn menu-toggle" data-menu-toggle aria-controls="mobile-menu" aria-expanded="false"></button>
      </div>
    </div></div>
    <div id="mobile-menu" class="mobile-menu" aria-label="Menu">
      <nav class="mobile-menu__nav" aria-label="Mobile">${nav.map(mobileItem).join('')}</nav>
      <div class="mobile-menu__foot">
        <a class="btn btn-block" href="${login.href}">${login.label}</a>
        <div class="mobile-menu__tools">
          <button type="button" class="btn btn-ghost" data-theme-toggle><span data-toggle-icon></span><span>Theme</span></button>
          <button type="button" class="btn btn-ghost" data-dir-toggle><span data-toggle-icon></span><span>Direction</span></button>
        </div>
      </div>
    </div>`;
  }
  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = `
    <div class="container-studio">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand" href="index.html">${icons.logo}<span>${brand.name}<span class="brand__suffix"> ${brand.suffix}</span></span></a>
          <p class="text-(--muted)">${brand.about}</p>
          <ul class="social" aria-label="Social media">${social.map((s) => `<li><a class="icon-btn" href="${s.href}" aria-label="${s.name}">${icons[s.icon]}</a></li>`).join('')}</ul>
        </div>
        <div><h2 class="footer-h">Explore</h2><ul class="footer-links">
          ${nav.flatMap((n) => n.children || [n]).map((n) => `<li>${plain(n)}</li>`).join('')}</ul></div>
        <div><h2 class="footer-h">Studios</h2><ul class="footer-links">
          ${studios.map((n) => `<li>${plain(n)}</li>`).join('')}</ul></div>
        <div><h2 class="footer-h">Contact</h2><ul class="footer-contact">
          ${contactRow('mapPin', contact.address.map((l) => `<span class="block">${l}</span>`).join(''))}
          ${contactRow('phone', `<a href="${contact.phoneHref}" dir="ltr">${contact.phone}</a>`)}
          ${contactRow('mail', `<a href="mailto:${contact.email}">${contact.email}</a>`)}
          ${contactRow('clock', `<span>${contact.hours}</span>`)}</ul></div>
      </div>
      <div class="footer-bar"><span>&copy; ${new Date().getFullYear()} ${brand.name} ${brand.suffix}. <span>All rights reserved.</span></span><span>${brand.tagline}</span></div>
    </div>`;
  }
}
