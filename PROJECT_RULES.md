# PROJECT_RULES — SIGNALROOM STUDIOS

## Stack
HTML5 + Tailwind CSS v4 (CLI) + Vanilla JS (ES modules). **Forbidden:** React, Vite, Tailwind Play CDN.

## Scope
Phase 1 = foundation only (tokens, shared header/footer, theme, direction, sticky header, scroll-to-top). Pages are shells with one `<h1>`.

## Single sources of truth
- Brand / nav / CTA / translations: `public/js/data.js`. Never hardcode in markup.
- Design tokens: `@theme` + semantic variables in `src/css/input.css`.
- Header/footer: `public/js/modules/layout.js`. Scroll-to-top: `modules/scroll-top.js` (injected once, never per page).
- Marketing pages load `public/js/main.js`; Login/Dashboard load `public/js/app-shell.js` (no marketing header).

## Layout standards
- Everything inside `.container-studio`; vertical rhythm via `.section`.
- Headings/paragraphs: start or center aligned only. No justified/end alignment.
- Pick the layout per section purpose (`.split`, `.band`, `.rule-list`, `.frame-*`); do not default to card grids. No repeating the same arrangement in consecutive sections.
- Balanced columns (`.split-5-7`, `.split-7-5`, 6/6); media uses `.frame-16x9|21x9|4x3`.
- Logical CSS properties only (`ms-`, `ps-`, `start-`, `inset-inline-*`); flip directional icons with `.flip-rtl`.
- Light/Dark via `data-theme`, LTR/RTL via `dir`, both persisted in localStorage (`sr-theme`, `sr-dir`) and applied by an inline head script (no flash).
- WCAG AA; visible `:focus-visible`; respect `prefers-reduced-motion`; no horizontal overflow from 320px.
- No public image credits/paths; no placeholder content.

## Commands
`npm run build` (minified CSS) · `npm run dev` (watch) · `npm run serve` (http://localhost:5173)

## Phase 2 conventions
- Contact details, social links, nav and studio list live in `public/js/data.js`; markup hydrates them (`data-contact="phone|email"`, layout.js footer).
- Arabic copy: add `'English text': 'Arabic'` to `public/js/i18n-ar.js`. Translation is automatic (text nodes + alt/aria-label/placeholder/title); write plain HTML, no per-element attributes. The `.brand` wordmark is never translated.
- Icons: Lucide paths in `modules/icons.js`; use `<span data-icon="name"></span>` in markup.
- Homepage components are in `src/css/home.css`; page-specific JS widgets (tabs, estimator, clock) are in `modules/widgets.js` and no-op when absent.
- Images: `public/assets/img/<key>.jpg` (1920w) + `<key>-sm.jpg` (960w), used via `srcset`. Each image is used once across both homepages. No credits or source info in public markup.

## Phase 3 conventions
- Inner pages use `.hero.hero--page` (+ `hero--about|studios|pricing|contact`): identical height on all four, unique layout each. Styles in `src/css/inner.css`.
- Inner-page Arabic copy lives in `public/js/i18n-ar-inner.js` (merged by `i18n-ar.js`). Avoid reusing an English key with a different meaning.
- Enquiry form: `modules/form.js` (validation, `?studio=&date=&hours=` prefill, opens the visitor's email app). No backend.
- `serve.json` disables clean URLs so query strings survive in local dev.

## Phase 4 conventions (application pages)
- Login and Dashboard are application UIs: no marketing header/footer. Entry: `public/js/app/login.js` and `public/js/app/dashboard.js`, both calling `initApp()` from `public/js/app-shell.js`.
- Data, pricing, availability and persistence live in `public/js/app/store.js` (localStorage keys `sr-app-v1`, `sr-session`, `sr-remember`, `sr-sidebar`). No backend; authentication, payment and availability are frontend-only.
- Views are template functions in `public/js/app/views.js`; dialogs/toasts/format helpers in `ui.js`. Hash routes: `#/overview|book|bookings|invoices|profile`.
- Arabic strings: `public/js/i18n-ar-app.js`. Wrap dynamic values (names, dates, IDs) in their own element so surrounding text still matches the dictionary.
- Styles: `src/css/app.css`. `@import`ed files are inlined before `input.css` rules, so overrides of base components (`.btn`, `.icon-btn`) need higher specificity.
- Never expose the words "demo", "dummy" or "static" in UI copy.
