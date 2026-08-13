import { createApp, type Component } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/styles/index.scss'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import './fontawesome'

createApp(App).use(store).use(router).component('FontAwesomeIcon', FontAwesomeIcon as Component).mount('#app')
