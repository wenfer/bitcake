import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const resolveBase = () => {
  const base = import.meta.env.BASE_URL || '/'
  if (base.startsWith('.') && typeof window !== 'undefined') {
    const url = new URL(base, window.location.href)
    return url.pathname
  }
  return base
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '种子列表' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: '设置' },
      },
      {
        path: 'stats',
        name: 'Stats',
        component: () => import('@/views/StatsView.vue'),
        meta: { title: '数据统计' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '连接服务器' },
  },
]

const router = createRouter({
  history: createWebHistory(resolveBase()),
  routes,
})

export default router
