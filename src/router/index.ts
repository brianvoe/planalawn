import { createRouter, createWebHistory } from 'vue-router'
import { trackPageView } from '../analytics'
import Home from '../home/home.vue'
import Calendar from '../calendar/calendar.vue'
import Tasks from '../tasks/tasks.vue'
import TaskDetail from '../tasks/task-detail.vue'
import Seeds from '../seeds/seeds.vue'
import Sprayer from '../sprayer/sprayer.vue'
import Settings from '../settings/settings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/calendar', name: 'calendar', component: Calendar },
    { path: '/tasks', name: 'tasks', component: Tasks },
    { path: '/tasks/:id', name: 'task-detail', component: TaskDetail, props: true },
    { path: '/seeds', name: 'seeds', component: Seeds },
    { path: '/tools/sprayer', name: 'sprayer', component: Sprayer },
    { path: '/settings', name: 'settings', component: Settings },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  trackPageView(to.fullPath)
})

export default router
