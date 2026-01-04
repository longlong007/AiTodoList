<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import { useAuthStore } from '@/stores/auth'
import type { Todo, CreateTodoDto, Importance, TodoStatus } from '@/types'

const router = useRouter()
const todoStore = useTodoStore()
const authStore = useAuthStore()

// State
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingTodo = ref<Todo | null>(null)
const filterStatus = ref<string>('')
const filterImportance = ref<string>('')
const sortBy = ref('priority')

// Form state
const newTodo = ref<CreateTodoDto>({
  title: '',
  description: '',
  importance: 'C',
  urgency: 3,
  dueDate: '',
})

// Computed
const filteredTodos = computed(() => todoStore.todos)

// Methods
const fetchTodos = async () => {
  await todoStore.fetchTodos({
    status: filterStatus.value || undefined,
    importance: filterImportance.value || undefined,
    sortBy: sortBy.value,
  })
}

const handleAddTodo = async () => {
  if (!newTodo.value.title.trim()) return
  
  await todoStore.createTodo(newTodo.value)
  showAddModal.value = false
  newTodo.value = { title: '', description: '', importance: 'C', urgency: 3, dueDate: '' }
}

const handleEditTodo = async () => {
  if (!editingTodo.value) return
  
  await todoStore.updateTodo(editingTodo.value.id, {
    title: editingTodo.value.title,
    description: editingTodo.value.description,
    importance: editingTodo.value.importance,
    urgency: editingTodo.value.urgency,
    status: editingTodo.value.status,
    dueDate: editingTodo.value.dueDate,
  })
  showEditModal.value = false
  editingTodo.value = null
}

const openEditModal = (todo: Todo) => {
  editingTodo.value = { ...todo }
  showEditModal.value = true
}

const handleDeleteTodo = async (id: string) => {
  if (confirm('确定要删除这个待办事项吗？')) {
    await todoStore.deleteTodo(id)
  }
}

const toggleStatus = async (todo: Todo) => {
  const newStatus: TodoStatus = todo.status === 'completed' ? 'pending' : 'completed'
  await todoStore.updateTodo(todo.id, { status: newStatus })
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const getImportanceLabel = (importance: Importance) => {
  const labels = { A: '最重要', B: '重要', C: '一般', D: '不重要' }
  return labels[importance]
}

const getUrgencyLabel = (urgency: number) => {
  const labels: Record<number, string> = { 1: '最紧急', 2: '紧急', 3: '一般', 4: '不急', 5: '可延后' }
  return labels[urgency] || '一般'
}

const getStatusLabel = (status: TodoStatus) => {
  const labels = { pending: '待处理', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
  return labels[status]
}

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

onMounted(() => {
  fetchTodos()
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Background decorations -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Header -->
    <header class="glass sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="font-display text-xl font-bold text-white">Todo Master</h1>
        </div>

        <div class="flex items-center gap-4">
          <router-link to="/analysis" class="flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="hidden sm:inline">AI分析</span>
            <span v-if="!authStore.user?.isPro" class="text-xs bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded">Pro</span>
          </router-link>
          <!-- Pro Badge or Upgrade Link -->
          <router-link 
            v-if="authStore.user?.isPro" 
            to="/pricing"
            class="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg text-white text-xs font-medium"
          >
            <span>👑</span>
            <span>Pro</span>
          </router-link>
          <router-link 
            v-else 
            to="/pricing"
            class="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg text-white text-xs font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all"
          >
            <span>✨</span>
            <span>升级Pro</span>
          </router-link>
          <div class="flex items-center gap-2 text-gray-300">
            <span class="text-sm">{{ authStore.user?.nickname || authStore.user?.email }}</span>
          </div>
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
      <!-- Filters & Actions -->
      <div class="flex flex-wrap gap-4 items-center justify-between mb-8">
        <div class="flex flex-wrap gap-3">
          <select v-model="filterStatus" @change="fetchTodos" class="select-field w-32">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <select v-model="filterImportance" @change="fetchTodos" class="select-field w-32">
            <option value="">全部重要性</option>
            <option value="A">A - 最重要</option>
            <option value="B">B - 重要</option>
            <option value="C">C - 一般</option>
            <option value="D">D - 不重要</option>
          </select>
          <select v-model="sortBy" @change="fetchTodos" class="select-field w-32">
            <option value="priority">按优先级</option>
            <option value="createdAt">按创建时间</option>
            <option value="dueDate">按截止日期</option>
          </select>
        </div>

        <button @click="showAddModal = true" class="btn-primary flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>新建待办</span>
        </button>
      </div>

      <!-- Todo List -->
      <div v-if="todoStore.loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-400 mt-2">加载中...</p>
      </div>

      <div v-else-if="filteredTodos.length === 0" class="text-center py-16">
        <div class="w-24 h-24 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-gray-400 text-lg">暂无待办事项</p>
        <p class="text-gray-500 text-sm mt-1">点击上方按钮创建新的待办</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(todo, index) in filteredTodos"
          :key="todo.id"
          class="glass-card p-4 hover:bg-white/10 transition-all duration-300 animate-slide-up"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <div class="flex items-start gap-4">
            <!-- Checkbox -->
            <button
              @click="toggleStatus(todo)"
              :class="[
                'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                todo.status === 'completed' 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-gray-500 hover:border-primary-500'
              ]"
            >
              <svg v-if="todo.status === 'completed'" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 :class="['font-medium', todo.status === 'completed' ? 'text-gray-500 line-through' : 'text-white']">
                  {{ todo.title }}
                </h3>
              </div>
              <p v-if="todo.description" class="text-gray-400 text-sm mb-2 line-clamp-2">
                {{ todo.description }}
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span :class="['text-xs px-2 py-1 rounded-lg border', `importance-${todo.importance}`]">
                  {{ todo.importance }} · {{ getImportanceLabel(todo.importance) }}
                </span>
                <span :class="['text-xs px-2 py-1 rounded-lg', `urgency-${todo.urgency}`]">
                  {{ todo.urgency }} · {{ getUrgencyLabel(todo.urgency) }}
                </span>
                <span :class="['text-xs', `status-${todo.status}`]">
                  {{ getStatusLabel(todo.status) }}
                </span>
                <span v-if="todo.dueDate" class="text-xs text-gray-500">
                  📅 {{ formatDate(todo.dueDate) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button
                @click="openEditModal(todo)"
                class="p-2 text-gray-400 hover:text-primary-400 hover:bg-white/10 rounded-lg transition-all"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="handleDeleteTodo(todo.id)"
                class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="mt-8 text-center text-gray-500 text-sm">
        共 {{ todoStore.total }} 个待办事项
      </div>
    </main>

    <!-- Add Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="glass-card w-full max-w-lg p-6 relative animate-slide-up">
          <h2 class="text-xl font-bold text-white mb-6">新建待办</h2>
          
          <form @submit.prevent="handleAddTodo" class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">标题 *</label>
              <input v-model="newTodo.title" type="text" placeholder="输入待办标题" class="input-field" required />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">描述</label>
              <textarea v-model="newTodo.description" placeholder="输入详细描述（可选）" class="input-field h-24 resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-1">重要性</label>
                <select v-model="newTodo.importance" class="select-field">
                  <option value="A">A - 最重要</option>
                  <option value="B">B - 重要</option>
                  <option value="C">C - 一般</option>
                  <option value="D">D - 不重要</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">紧急程度</label>
                <select v-model="newTodo.urgency" class="select-field">
                  <option :value="1">1 - 最紧急</option>
                  <option :value="2">2 - 紧急</option>
                  <option :value="3">3 - 一般</option>
                  <option :value="4">4 - 不急</option>
                  <option :value="5">5 - 可延后</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">截止日期</label>
              <input v-model="newTodo.dueDate" type="date" class="input-field" />
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" @click="showAddModal = false" class="btn-secondary">取消</button>
              <button type="submit" class="btn-primary">创建</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="showEditModal && editingTodo" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showEditModal = false"></div>
        <div class="glass-card w-full max-w-lg p-6 relative animate-slide-up">
          <h2 class="text-xl font-bold text-white mb-6">编辑待办</h2>
          
          <form @submit.prevent="handleEditTodo" class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">标题 *</label>
              <input v-model="editingTodo.title" type="text" class="input-field" required />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">描述</label>
              <textarea v-model="editingTodo.description" class="input-field h-24 resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-1">重要性</label>
                <select v-model="editingTodo.importance" class="select-field">
                  <option value="A">A - 最重要</option>
                  <option value="B">B - 重要</option>
                  <option value="C">C - 一般</option>
                  <option value="D">D - 不重要</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">紧急程度</label>
                <select v-model="editingTodo.urgency" class="select-field">
                  <option :value="1">1 - 最紧急</option>
                  <option :value="2">2 - 紧急</option>
                  <option :value="3">3 - 一般</option>
                  <option :value="4">4 - 不急</option>
                  <option :value="5">5 - 可延后</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-1">状态</label>
                <select v-model="editingTodo.status" class="select-field">
                  <option value="pending">待处理</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">截止日期</label>
                <input v-model="editingTodo.dueDate" type="date" class="input-field" />
              </div>
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" @click="showEditModal = false" class="btn-secondary">取消</button>
              <button type="submit" class="btn-primary">保存</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

