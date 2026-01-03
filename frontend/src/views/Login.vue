<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginType = ref<'email' | 'phone' | 'wechat'>('email')
const identifier = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!identifier.value || !password.value) {
    error.value = '请填写完整信息'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (loginType.value === 'email') {
      await authStore.loginWithEmail(identifier.value, password.value)
    } else if (loginType.value === 'phone') {
      await authStore.loginWithPhone(identifier.value, password.value)
    }
    router.push('/todos')
  } catch (err: any) {
    error.value = err.response?.data?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

const handleWechatLogin = async () => {
  // 模拟微信登录
  const mockCode = 'mock_wechat_code_' + Date.now()
  loading.value = true
  error.value = ''
  
  try {
    await authStore.loginWithWechat(mockCode)
    router.push('/todos')
  } catch (err: any) {
    error.value = err.response?.data?.message || '微信登录失败'
  } finally {
    loading.value = false
  }
}

const getPlaceholder = () => {
  return loginType.value === 'email' ? '请输入邮箱地址' : '请输入手机号'
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <!-- Background decorations -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl"></div>
    </div>

    <div class="glass-card w-full max-w-md p-8 animate-fade-in relative z-10">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="font-display text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          Todo Master
        </h1>
        <p class="text-gray-400 mt-2">智能待办管理，让效率飞升</p>
      </div>

      <!-- Login Type Tabs -->
      <div class="flex bg-white/5 rounded-xl p-1 mb-6">
        <button
          v-for="type in (['email', 'phone'] as const)"
          :key="type"
          @click="loginType = type"
          :class="[
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300',
            loginType === type 
              ? 'bg-primary-500 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          ]"
        >
          {{ type === 'email' ? '📧 邮箱登录' : '📱 手机登录' }}
        </button>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <input
            v-model="identifier"
            type="text"
            :placeholder="getPlaceholder()"
            class="input-field"
          />
        </div>
        <div>
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            class="input-field"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="text-red-400 text-sm text-center bg-red-500/10 py-2 px-4 rounded-lg">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg v-if="loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ loading ? '登录中...' : '登录' }}</span>
        </button>
      </form>

      <!-- Divider -->
      <div class="flex items-center my-6">
        <div class="flex-1 border-t border-white/10"></div>
        <span class="px-4 text-gray-500 text-sm">或</span>
        <div class="flex-1 border-t border-white/10"></div>
      </div>

      <!-- WeChat Login -->
      <button
        @click="handleWechatLogin"
        :disabled="loading"
        class="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
        </svg>
        <span>微信登录</span>
      </button>

      <!-- Register Link -->
      <p class="text-center mt-6 text-gray-400">
        还没有账号？
        <router-link to="/register" class="text-primary-400 hover:text-primary-300 font-medium">
          立即注册
        </router-link>
      </p>
    </div>
  </div>
</template>

