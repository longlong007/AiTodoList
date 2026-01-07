<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  const token = route.query.token as string
  
  if (token) {
    // 保存 token 并更新 store
    localStorage.setItem('token', token)
    
    // 获取用户信息（这会同时更新 store 中的 token 和 user）
    try {
      await authStore.fetchCurrentUser()
      router.push('/todos')
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      // 清除可能的无效 token
      localStorage.removeItem('token')
      router.push('/login')
    }
  } else {
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

