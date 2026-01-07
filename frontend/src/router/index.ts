import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/todos'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Register.vue'),
      meta: { guest: true }
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: () => import('@/views/AuthCallback.vue'),
    },
    {
      path: '/todos',
      name: 'Todos',
      component: () => import('@/views/Todos.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/analysis',
      name: 'Analysis',
      component: () => import('@/views/Analysis.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pricing',
      name: 'Pricing',
      component: () => import('@/views/Pricing.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // OAuth 回调路由不进行认证检查，让组件内部处理
  if (to.path === '/auth/callback') {
    next()
    return
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('Router guard: not authenticated, redirecting to /login')
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    console.log('Router guard: already authenticated, redirecting to /todos')
    next('/todos')
  } else {
    next()
  }
})

export default router

