import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { trackPageView } from '../analytics'
import { applyPageMeta } from './head'
import { metaForRoute } from './meta'
/**
 * Routes load their own chunk on demand.
 *
 * The seed pages carry the NTEP trial data with them, which is most of what
 * this app weighs. Importing them statically meant every visitor downloaded
 * all of it to read a mowing playbook.
 */
const Home = () => import('../home/home.vue')
const Calendar = () => import('../calendar/calendar.vue')
const Tasks = () => import('../tasks/tasks.vue')
const TaskDetail = () => import('../tasks/task-detail.vue')
const Seeds = () => import('../seeds/seeds.vue')
const Apply = () => import('../apply/apply.vue')
const Settings = () => import('../settings/settings.vue')

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
  // Before the page view, so GA4 reads the title of the page we just moved to
  // rather than the one we left.
  applyPageMeta(metaForRoute(String(to.name ?? ''), to.params), to.path)
  trackPageView(to.fullPath)
})

export default router
