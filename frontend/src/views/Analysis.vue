<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import { useAuthStore } from '@/stores/auth'
import { aiApi } from '@/api/ai'

const router = useRouter()
const todoStore = useTodoStore()
const authStore = useAuthStore()

const analysis = ref('')
const loading = ref(false)
const error = ref('')
const needsUpgrade = ref(false)

const stats = computed(() => todoStore.statistics)
const isPro = computed(() => authStore.user?.isPro)

const fetchAnalysis = async () => {
  // 如果不是Pro用户，直接显示升级提示
  if (!isPro.value) {
    needsUpgrade.value = true
    return
  }

  loading.value = true
  error.value = ''
  needsUpgrade.value = false
  
  try {
    const { data } = await aiApi.analyze()
    analysis.value = data.analysis
  } catch (err: any) {
    if (err.response?.status === 403) {
      needsUpgrade.value = true
    } else {
      error.value = err.response?.data?.message || 'AI分析服务暂时不可用'
    }
  } finally {
    loading.value = false
  }
}

const formatAnalysis = (text: string) => {
  // 简单的 Markdown 渲染
  return text
    .replace(/## (.*)/g, '<h2 class="text-xl font-bold text-primary-400 mt-6 mb-3">$1</h2>')
    .replace(/### (.*)/g, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary-300">$1</strong>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n- /g, '</p><li class="ml-4 text-gray-300">• ')
    .replace(/\n\d+\. /g, '</p><li class="ml-4 text-gray-300">')
    .replace(/---/g, '<hr class="border-white/10 my-4">')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  await todoStore.fetchStatistics()
  await fetchAnalysis()
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Background decorations -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Header -->
    <header class="glass sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/todos" class="flex items-center gap-3 text-white hover:text-primary-400 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 class="font-display text-xl font-bold">AI 智能分析</h1>
          </router-link>
        </div>

        <div class="flex items-center gap-4">
          <span class="text-gray-400 text-sm">{{ authStore.user?.nickname || authStore.user?.email }}</span>
          <button @click="handleLogout" class="text-gray-400 hover:text-red-400 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8 relative z-10">
      <!-- Statistics Cards -->
      <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="glass-card p-4 text-center">
          <div class="text-3xl font-bold text-white">{{ stats.total }}</div>
          <div class="text-gray-400 text-sm">总待办</div>
        </div>
        <div class="glass-card p-4 text-center">
          <div class="text-3xl font-bold text-green-400">{{ stats.completed }}</div>
          <div class="text-gray-400 text-sm">已完成</div>
        </div>
        <div class="glass-card p-4 text-center">
          <div class="text-3xl font-bold text-yellow-400">{{ stats.pending + stats.inProgress }}</div>
          <div class="text-gray-400 text-sm">进行中</div>
        </div>
        <div class="glass-card p-4 text-center">
          <div class="text-3xl font-bold text-primary-400">{{ stats.completionRate }}%</div>
          <div class="text-gray-400 text-sm">完成率</div>
        </div>
      </div>

      <!-- Importance & Urgency Distribution -->
      <div v-if="stats" class="grid md:grid-cols-2 gap-6 mb-8">
        <!-- Importance -->
        <div class="glass-card p-6">
          <h3 class="text-lg font-semibold text-white mb-4">📊 重要性分布</h3>
          <div class="space-y-3">
            <div v-for="(value, key) in stats.byImportance" :key="key" class="flex items-center gap-3">
              <span :class="['w-8 text-center py-1 rounded text-xs font-bold', `importance-${key}`]">{{ key }}</span>
              <div class="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                <div
                  :class="['h-full rounded-full transition-all duration-500', 
                    key === 'A' ? 'bg-red-500' : 
                    key === 'B' ? 'bg-orange-500' : 
                    key === 'C' ? 'bg-yellow-500' : 'bg-green-500'
                  ]"
                  :style="{ width: `${stats.total ? (value / stats.total) * 100 : 0}%` }"
                ></div>
              </div>
              <span class="text-gray-400 text-sm w-12 text-right">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- Urgency -->
        <div class="glass-card p-6">
          <h3 class="text-lg font-semibold text-white mb-4">⏰ 紧急程度分布</h3>
          <div class="space-y-3">
            <div v-for="i in 5" :key="i" class="flex items-center gap-3">
              <span :class="['w-8 text-center py-1 rounded text-xs font-bold', `urgency-${i}`]">{{ i }}</span>
              <div class="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                <div
                  :class="['h-full rounded-full transition-all duration-500',
                    i === 1 ? 'bg-purple-500' :
                    i === 2 ? 'bg-blue-500' :
                    i === 3 ? 'bg-cyan-500' :
                    i === 4 ? 'bg-teal-500' : 'bg-gray-500'
                  ]"
                  :style="{ width: `${stats.total ? ((stats.byUrgency[i] || 0) / stats.total) * 100 : 0}%` }"
                ></div>
              </div>
              <span class="text-gray-400 text-sm w-12 text-right">{{ stats.byUrgency[i] || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Analysis -->
      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-2xl">🤖</span>
            AI 智能分析报告
          </h2>
          <button
            @click="fetchAnalysis"
            :disabled="loading"
            class="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg :class="['w-4 h-4', loading && 'animate-spin']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新分析
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-flex items-center gap-3 text-primary-400">
            <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-lg">AI 正在分析您的待办数据...</span>
          </div>
          <p class="text-gray-500 mt-2">基于智谱 GLM-4 大模型</p>
        </div>

        <!-- Upgrade Prompt -->
        <div v-else-if="needsUpgrade" class="text-center py-12">
          <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
            <span class="text-4xl">👑</span>
          </div>
          <h3 class="text-2xl font-bold text-white mb-3">AI智能分析是Pro会员专属功能</h3>
          <p class="text-gray-400 mb-6 max-w-md mx-auto">
            升级Pro会员，解锁AI智能分析，获取个性化的时间管理建议，让你的效率提升更科学！
          </p>
          <router-link to="/pricing" class="btn-primary inline-flex items-center gap-2">
            <span>✨</span>
            <span>立即升级Pro</span>
          </router-link>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-red-400">{{ error }}</p>
          <button @click="fetchAnalysis" class="mt-4 text-primary-400 hover:text-primary-300">点击重试</button>
        </div>

        <!-- Analysis Content -->
        <div v-else class="prose prose-invert max-w-none">
          <div class="text-gray-300 leading-relaxed" v-html="formatAnalysis(analysis)"></div>
        </div>
      </div>

      <!-- Powered by -->
      <div class="text-center mt-8 text-gray-500 text-sm">
        Powered by 智谱 GLM-4 大模型
      </div>
    </main>
  </div>
</template>

