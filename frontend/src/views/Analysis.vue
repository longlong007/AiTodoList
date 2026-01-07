<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import { useAuthStore } from '@/stores/auth'
import { aiApi } from '@/api/ai'
import { reportApi, type Report } from '@/api/report'

const router = useRouter()
const todoStore = useTodoStore()
const authStore = useAuthStore()

const analysis = ref('')
const loading = ref(false)
const error = ref('')
const needsUpgrade = ref(false)
const showHistoryModal = ref(false)
const historicalReports = ref<Report[]>([])
const loadingReports = ref(false)
const savingReport = ref(false)
const currentReportId = ref<string | null>(null)

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

const saveReport = async () => {
  if (!analysis.value) {
    alert('没有可保存的报告')
    return
  }

  savingReport.value = true
  try {
    const title = `AI分析报告 - ${new Date().toLocaleDateString('zh-CN')}`
    const statisticsData = JSON.stringify(stats.value)
    
    const { data } = await reportApi.create({
      title,
      content: analysis.value,
      statisticsData,
    })
    
    currentReportId.value = data.data.id
    alert('报告保存成功！')
  } catch (err: any) {
    console.error('保存报告失败:', err)
    alert(err.response?.data?.message || '保存报告失败')
  } finally {
    savingReport.value = false
  }
}

const downloadPdf = async () => {
  if (!currentReportId.value) {
    alert('请先保存报告')
    return
  }

  try {
    const { data } = await reportApi.downloadPdf(currentReportId.value)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `report-${currentReportId.value}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    console.error('下载PDF失败:', err)
    alert('下载PDF失败')
  }
}

const fetchHistoricalReports = async () => {
  loadingReports.value = true
  try {
    const { data } = await reportApi.getAll()
    historicalReports.value = data.data
    showHistoryModal.value = true
  } catch (err: any) {
    console.error('获取历史报告失败:', err)
    alert('获取历史报告失败')
  } finally {
    loadingReports.value = false
  }
}

const viewHistoricalReport = async (report: Report) => {
  analysis.value = report.content
  currentReportId.value = report.id
  showHistoryModal.value = false
  
  // 如果有统计数据快照，也可以恢复（可选）
  if (report.statisticsData) {
    try {
      // 可以在这里恢复统计数据
      console.log('统计数据快照:', JSON.parse(report.statisticsData))
    } catch (e) {
      console.error('解析统计数据失败:', e)
    }
  }
}

const deleteReport = async (id: string) => {
  if (!confirm('确定要删除这个报告吗？')) {
    return
  }

  try {
    await reportApi.delete(id)
    historicalReports.value = historicalReports.value.filter(r => r.id !== id)
    if (currentReportId.value === id) {
      currentReportId.value = null
    }
    alert('删除成功')
  } catch (err: any) {
    console.error('删除报告失败:', err)
    alert('删除报告失败')
  }
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
          <div class="flex items-center gap-2">
            <button
              @click="fetchHistoricalReports"
              :disabled="loadingReports"
              class="btn-secondary flex items-center gap-2 text-sm"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              历史报告
            </button>
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
        <div v-else>
          <div class="prose prose-invert max-w-none mb-6">
            <div class="text-gray-300 leading-relaxed" v-html="formatAnalysis(analysis)"></div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              @click="saveReport"
              :disabled="savingReport || !analysis"
              class="btn-primary flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {{ savingReport ? '保存中...' : '保存报告' }}
            </button>
            <button
              @click="downloadPdf"
              :disabled="!currentReportId"
              class="btn-secondary flex items-center gap-2"
              :title="currentReportId ? '下载PDF' : '请先保存报告'"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              下载 PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Powered by -->
      <div class="text-center mt-8 text-gray-500 text-sm">
        Powered by 智谱 GLM-4 大模型
      </div>
    </main>

    <!-- Historical Reports Modal -->
    <div v-if="showHistoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        @click="showHistoryModal = false"
      ></div>
      
      <!-- Modal Content -->
      <div class="relative glass-card p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">历史报告</h3>
          <button 
            @click="showHistoryModal = false"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="loadingReports" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p class="mt-2 text-gray-400">加载中...</p>
        </div>

        <div v-else-if="historicalReports.length === 0" class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-500/10 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p class="text-gray-400">还没有保存的报告</p>
        </div>

        <div v-else class="space-y-3">
          <div 
            v-for="report in historicalReports" 
            :key="report.id"
            class="glass-card p-4 hover:bg-white/5 transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h4 class="text-white font-semibold mb-1">{{ report.title }}</h4>
                <p class="text-gray-400 text-sm">
                  创建时间: {{ new Date(report.createdAt).toLocaleString('zh-CN') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="viewHistoricalReport(report)"
                  class="text-primary-400 hover:text-primary-300 transition-colors p-2"
                  title="查看"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  @click="() => { currentReportId = report.id; downloadPdf(); }"
                  class="text-green-400 hover:text-green-300 transition-colors p-2"
                  title="下载PDF"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  @click="deleteReport(report.id)"
                  class="text-red-400 hover:text-red-300 transition-colors p-2"
                  title="删除"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

