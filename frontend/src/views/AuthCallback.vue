<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  const token = route.query.token as string
  
  if (!token) {
    console.error('No token in callback')
    router.push('/login')
    return
  }
  
  try {
    // 1. 先保存 token 到 localStorage
    localStorage.setItem('token', token)
    
    // 2. 获取用户信息（内部会同步 token 到 store）
    await authStore.fetchCurrentUser()
    
    // 3. 成功后跳转
    console.log('OAuth login successful, redirecting to /todos')
    router.push('/todos')
  } catch (error) {
    console.error('OAuth callback failed:', error)
    // 清除无效 token
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      <p class="mt-4 text-gray-400">正在登录...</p>
    </div>
  </div>
</template>

