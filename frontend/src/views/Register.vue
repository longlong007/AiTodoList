<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const registerType = ref<'email' | 'phone'>('email')
const identifier = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (!identifier.value || !password.value || !confirmPassword.value) {
    error.value = '请填写完整信息'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  if (password.value.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (registerType.value === 'email') {
      await authStore.registerWithEmail(identifier.value, password.value)
    } else {
      await authStore.registerWithPhone(identifier.value, password.value)
    }
    router.push('/todos')
  } catch (err: any) {
    error.value = err.response?.data?.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}

const getPlaceholder = () => {
  return registerType.value === 'email' ? '请输入邮箱地址' : '请输入手机号'
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <!-- Background decorations -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
    </div>

    <div class="glass-card w-full max-w-md p-8 animate-fade-in relative z-10">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="font-display text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          创建账号
        </h1>
        <p class="text-gray-400 mt-2">开启高效待办管理之旅</p>
      </div>

      <!-- Register Type Tabs -->
      <div class="flex bg-white/5 rounded-xl p-1 mb-6">
        <button
          v-for="type in (['email', 'phone'] as const)"
          :key="type"
          @click="registerType = type"
          :class="[
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300',
            registerType === type 
              ? 'bg-primary-500 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          ]"
        >
          {{ type === 'email' ? '📧 邮箱注册' : '📱 手机注册' }}
        </button>
      </div>

      <!-- Register Form -->
      <form @submit.prevent="handleRegister" class="space-y-4">
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
            placeholder="请设置密码（至少6位）"
            class="input-field"
          />
        </div>
        <div>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="请确认密码"
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
          <span>{{ loading ? '注册中...' : '注册' }}</span>
        </button>
      </form>

      <!-- Login Link -->
      <p class="text-center mt-6 text-gray-400">
        已有账号？
        <router-link to="/login" class="text-primary-400 hover:text-primary-300 font-medium">
          立即登录
        </router-link>
      </p>
    </div>
  </div>
</template>

