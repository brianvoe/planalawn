import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { trackPageView } from '../analytics'
import Home from '../home/home.vue'
import Calendar from '../calendar/calendar.vue'
import Tasks from '../tasks/tasks.vue'
import TaskDetail from '../tasks/task-detail.vue'
import Seeds from '../seeds/seeds.vue'
import Apply from '../apply/apply.vue'
import Settings from '../settings/settings.vue'

function seedsProps(route: RouteLocationNormalized) {
  const raw = route.params.id
  const id = typeof raw === 'string' ? raw : ''
  const section = typeof route.meta.section === 'string' ? route.meta.section : ''
  return { id, section }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/calendar', name: 'calendar', component: Calendar },
    { path: '/tasks', name: 'tasks', component: Tasks },
    { path: '/tasks/:id', name: 'task-detail', component: TaskDetail, props: true },
    { path: '/seeds', name: 'seeds', component: Seeds },
    {
      path: '/seeds/blends',
      name: 'seed-blends',
      component: Seeds,
      meta: { section: 'blends' },
      props: seedsProps,
    },
    {
      path: '/seeds/blends/:id',
      name: 'seed-blend',
      component: Seeds,
      meta: { section: 'blends' },
      props: seedsProps,
    },
    {
      path: '/seeds/cultivars',
      name: 'seed-cultivars',
      component: Seeds,
      meta: { section: 'cultivars' },
      props: seedsProps,
    },
    {
      path: '/seeds/compare',
      name: 'seed-compare',
      component: Seeds,
      meta: { section: 'compare' },
      props: seedsProps,
    },
    {
      path: '/seeds/ntep',
      name: 'seed-ntep',
      component: Seeds,
      meta: { section: 'ntep' },
      props: seedsProps,
    },
    { path: '/seeds/:id', redirect: (to) => `/seeds/blends/${to.params.id}` },
    { path: '/calculate', name: 'calculate', component: Apply },
    // The tool started life as a sprayer-only calculator; keep old links alive.
    { path: '/tools/sprayer', redirect: '/calculate' },
    { path: '/how-much', redirect: '/calculate' },
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
