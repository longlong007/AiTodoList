<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { paymentApi } from '@/api/payment'
import type { Plan, PaymentMethod, PlanType } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const plans = ref<Plan[]>([])
const loading = ref(false)
const selectedPlan = ref<PlanType | null>(null)
const selectedPayment = ref<PaymentMethod>('alipay')
const showPaymentModal = ref(false)
const paying = ref(false)

const isPro = computed(() => authStore.user?.isPro)

const fetchPlans = async () => {
  loading.value = true
  try {
    const { data } = await paymentApi.getPlans()
    plans.value = data
  } finally {
    loading.value = false
  }
}

const selectPlan = (plan: Plan) => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  selectedPlan.value = plan.type
  showPaymentModal.value = true
}

const handlePaymentSuccess = async () => {
  showPaymentModal.value = false
  
  // 刷新用户信息
  try {
    await authStore.refreshUser()
    console.log('用户信息已更新，Pro状态:', authStore.user?.isPro)
    alert('🎉 支付成功！您已成为Pro会员，正在跳转...')
    // 跳转到待办列表页面
    setTimeout(() => {
      router.push('/todos')
    }, 1000)
  } catch (error) {
    console.error('更新用户信息失败:', error)
    alert('支付成功！请重新登录以更新会员状态')
    window.location.reload()
  }
}

const handlePay = async () => {
  if (!selectedPlan.value) return
  
  paying.value = true
  try {
    const { data } = await paymentApi.createOrder(selectedPlan.value, selectedPayment.value)
    
    // 监听支付窗口的消息
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'payment-success') {
        console.log('收到支付成功消息:', event.data)
        window.removeEventListener('message', handleMessage)
        await handlePaymentSuccess()
      } else if (event.data.type === 'payment-cancel') {
        console.log('支付已取消')
        window.removeEventListener('message', handleMessage)
        showPaymentModal.value = false
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // 打开支付页面
    if (data.payUrl) {
      const payWindow = window.open(data.payUrl, '_blank', 'width=500,height=600')
      
      // 检测支付窗口是否被关闭
      const checkClosed = setInterval(() => {
        if (payWindow && payWindow.closed) {
          clearInterval(checkClosed)
          // 如果窗口关闭但没收到消息，开始轮询
          setTimeout(() => {
            pollOrderStatus(data.orderNo)
          }, 1000)
        }
      }, 500)
    } else {
      // 开始轮询订单状态（备用方案）
      pollOrderStatus(data.orderNo)
    }
  } catch (error: any) {
    alert(error.response?.data?.message || '创建订单失败')
  } finally {
    paying.value = false
  }
}

const pollOrderStatus = async (orderNo: string) => {
  let attempts = 0
  const maxAttempts = 30 // 最多轮询30次，每次2秒
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      console.log('轮询超时，停止轮询')
      showPaymentModal.value = false
      return
    }
    
    try {
      console.log(`轮询订单状态 (${attempts + 1}/${maxAttempts}):`, orderNo)
      const { data } = await paymentApi.getOrder(orderNo)
      console.log('订单状态:', data)
      
      if (data.status === 'paid') {
        console.log('检测到支付成功，正在更新用户信息...')
        await handlePaymentSuccess()
        return
      }
    } catch (e) {
      console.error('查询订单失败:', e)
    }
    
    attempts++
    setTimeout(poll, 2000)
  }
  
  poll()
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const formatExpireDate = (date?: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Background decorations -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Header -->
    <header class="glass sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <router-link to="/todos" class="flex items-center gap-3 text-white hover:text-primary-400 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="font-display text-xl font-bold">Todo Master</h1>
        </router-link>

        <div class="flex items-center gap-4">
          <template v-if="authStore.isAuthenticated">
            <span class="text-gray-400 text-sm">{{ authStore.user?.nickname || authStore.user?.email }}</span>
            <button @click="handleLogout" class="text-gray-400 hover:text-red-400 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-secondary text-sm">登录</router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-12 relative z-10">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-400 text-sm mb-4">
          <span class="text-lg">✨</span>
          <span>解锁全部Pro功能</span>
        </div>
        <h1 class="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          升级 <span class="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Pro会员</span>
        </h1>
        <p class="text-gray-400 text-lg max-w-2xl mx-auto">
          AI智能分析你的待办习惯，提供个性化建议，让效率提升更科学
        </p>
      </div>

      <!-- Current Status -->
      <div v-if="isPro" class="glass-card p-6 mb-8 text-center">
        <div class="inline-flex items-center gap-2 text-primary-400 mb-2">
          <span class="text-2xl">👑</span>
          <span class="text-xl font-bold">您已是Pro会员</span>
        </div>
        <p class="text-gray-400">
          会员有效期至：{{ formatExpireDate(authStore.user?.subscriptionExpireAt) }}
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid md:grid-cols-3 gap-6 mb-12">
        <div
          v-for="plan in plans"
          :key="plan.type"
          :class="[
            'glass-card p-6 relative transition-all duration-300 hover:scale-105',
            plan.popular ? 'ring-2 ring-primary-500' : ''
          ]"
        >
          <!-- Popular Badge -->
          <div
            v-if="plan.popular"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full text-white text-sm font-medium"
          >
            最受欢迎
          </div>

          <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-white mb-2">{{ plan.name }}</h3>
            <div class="flex items-baseline justify-center gap-1">
              <span class="text-4xl font-bold text-white">{{ plan.priceDisplay }}</span>
              <span class="text-gray-400">/{{ plan.days }}天</span>
            </div>
            <div v-if="plan.originalPrice" class="mt-1">
              <span class="text-gray-500 line-through text-sm">{{ plan.originalPrice }}</span>
              <span class="ml-2 text-green-400 text-sm">{{ plan.discount }}</span>
            </div>
          </div>

          <!-- Features -->
          <ul class="space-y-3 mb-6">
            <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2 text-gray-300">
              <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ feature }}</span>
            </li>
          </ul>

          <button
            @click="selectPlan(plan)"
            :class="[
              'w-full py-3 rounded-xl font-medium transition-all',
              plan.popular 
                ? 'btn-primary' 
                : 'btn-secondary'
            ]"
          >
            {{ isPro ? '续费' : '立即升级' }}
          </button>
        </div>
      </div>

      <!-- Features Section -->
      <div class="glass-card p-8">
        <h2 class="text-2xl font-bold text-white text-center mb-8">Pro会员专属功能</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span class="text-3xl">🤖</span>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">AI智能分析</h3>
            <p class="text-gray-400 text-sm">基于智谱GLM-4大模型，深度分析你的待办习惯，提供个性化改进建议</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <span class="text-3xl">📊</span>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">数据统计</h3>
            <p class="text-gray-400 text-sm">多维度数据分析，可视化展示你的目标完成情况和时间管理效率</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <span class="text-3xl">💎</span>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">专属标识</h3>
            <p class="text-gray-400 text-sm">Pro会员专属徽章和标识，彰显你的高效态度</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Payment Modal -->
    <Teleport to="body">
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showPaymentModal = false"></div>
        <div class="glass-card w-full max-w-md p-6 relative animate-slide-up">
          <h2 class="text-xl font-bold text-white mb-6 text-center">选择支付方式</h2>
          
          <!-- Payment Methods -->
          <div class="space-y-3 mb-6">
            <button
              @click="selectedPayment = 'alipay'"
              :class="[
                'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all',
                selectedPayment === 'alipay' 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-white/10 hover:border-white/20'
              ]"
            >
              <div class="w-10 h-10 bg-[#1677ff] rounded-lg flex items-center justify-center">
                <span class="text-white text-xl">支</span>
              </div>
              <span class="text-white font-medium">支付宝</span>
              <div v-if="selectedPayment === 'alipay'" class="ml-auto">
                <svg class="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </button>

            <button
              @click="selectedPayment = 'wechat'"
              :class="[
                'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all',
                selectedPayment === 'wechat' 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-white/10 hover:border-white/20'
              ]"
            >
              <div class="w-10 h-10 bg-[#07c160] rounded-lg flex items-center justify-center">
                <span class="text-white text-xl">微</span>
              </div>
              <span class="text-white font-medium">微信支付</span>
              <div v-if="selectedPayment === 'wechat'" class="ml-auto">
                <svg class="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </button>
          </div>

          <div class="flex gap-3">
            <button
              @click="showPaymentModal = false"
              class="flex-1 btn-secondary"
            >
              取消
            </button>
            <button
              @click="handlePay"
              :disabled="paying"
              class="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <svg v-if="paying" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ paying ? '处理中...' : '确认支付' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

