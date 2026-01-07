<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  console.log('AuthCallback mounted, processing OAuth callback...')
  const token = route.query.token as string
  
  if (!token) {
    console.error('❌ No token in callback URL')
    router.push('/login')
    return
  }
  
  console.log('✓ Token received:', token.substring(0, 20) + '...')
  
  try {
    // 使用 handleOAuthCallback 方法处理回调
    await authStore.handleOAuthCallback(token)
    
    console.log('✓ OAuth login successful, redirecting to /todos')
    
    // 使用 replace 而不是 push，避免可以返回到回调页面
    router.replace('/todos')
  } catch (error) {
    console.error('❌ OAuth callback failed:', error)
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

