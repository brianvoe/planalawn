import { createApp, type Component } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/styles/index.scss'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import './fontawesome'
import { reveal } from './directives/reveal'

const app = createApp(App)
  .use(store)
  .use(router)
  .component('FontAwesomeIcon', FontAwesomeIcon as Component)
  .directive('reveal', reveal)

/**
 * Mounting waits for the first route's component to arrive.
 *
 * Mounting replaces the prerendered markup with a fresh render — and with the
 * routes split, the component for this URL is still in flight at that moment,
 * so <router-view> renders nothing. The page collapses to the bar and the
 * footer, paints that way, and springs back when the chunk lands. It measured
 * as a 0.34 layout shift, most of the site's CLS, on every page.
 *
 * Waiting costs nothing that is visible: the prerendered page is already on
 * screen and correct, and this only delays the point at which it becomes
 * interactive. The alternative is hydrating rather than replacing, which is
 * the better answer in principle but needs a render that matches the markup
 * exactly — and some of these components mint a fresh id every time they run.
 */
router.isReady().then(() => app.mount('#app'))
