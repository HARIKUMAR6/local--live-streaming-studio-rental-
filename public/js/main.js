import { renderLayout } from './modules/layout.js';
import { initTheme } from './modules/theme.js';
import { initDirection } from './modules/direction.js';
import { initNav } from './modules/nav.js';
import { initScrollTop } from './modules/scroll-top.js';
import { initForm } from './modules/form.js';
import { initContact, initIcons, initTabs, initEstimator, initClock } from './modules/widgets.js';

renderLayout();
initIcons();
initContact();
initTabs();
initEstimator();
initClock();
initForm();
initTheme();
initNav();
initScrollTop();
initDirection(); // last: translates everything rendered above
