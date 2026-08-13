import { createRouter, createWebHistory } from 'vue-router'
import { trackPageView } from '../analytics'
import HomeView from '../views/HomeView.vue'
import CalendarView from '../views/CalendarView.vue'
import TasksView from '../views/TasksView.vue'
import TaskDetailView from '../views/TaskDetailView.vue'
import SeedsView from '../views/SeedsView.vue'
import SprayerToolView from '../views/SprayerToolView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/calendar', name: 'calendar', component: CalendarView },
    { path: '/tasks', name: 'tasks', component: TasksView },
    { path: '/tasks/:id', name: 'task-detail', component: TaskDetailView, props: true },
    { path: '/seeds', name: 'seeds', component: SeedsView },
    { path: '/tools/sprayer', name: 'sprayer', component: SprayerToolView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  trackPageView(to.fullPath)
})

export default router
