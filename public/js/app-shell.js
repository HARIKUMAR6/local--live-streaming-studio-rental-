// Shared initialisation for application pages (login, dashboard): theme, direction, scroll-to-top.
import { initTheme } from './modules/theme.js';
import { initDirection } from './modules/direction.js';
import { initScrollTop } from './modules/scroll-top.js';

export function initApp() {
  initTheme();
  initScrollTop();
  initDirection(); // last: translates everything rendered before it
}
