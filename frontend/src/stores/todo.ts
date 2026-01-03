import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Todo, CreateTodoDto, UpdateTodoDto, TodoStatistics } from '@/types'
import { todoApi } from '@/api/todo'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const total = ref(0)
  const loading = ref(false)
  const statistics = ref<TodoStatistics | null>(null)

  const fetchTodos = async (params?: {
    page?: number
    limit?: number
    status?: string
    importance?: string
    urgency?: number
    sortBy?: string
  }) => {
    loading.value = true
    try {
      const { data } = await todoApi.getAll(params)
      todos.value = data.data
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  const createTodo = async (dto: CreateTodoDto) => {
    const { data } = await todoApi.create(dto)
    todos.value.unshift(data)
    total.value++
    return data
  }

  const updateTodo = async (id: string, dto: UpdateTodoDto) => {
    const { data } = await todoApi.update(id, dto)
    const index = todos.value.findIndex(t => t.id === id)
    if (index !== -1) {
      todos.value[index] = data
    }
    return data
  }

  const deleteTodo = async (id: string) => {
    await todoApi.delete(id)
    todos.value = todos.value.filter(t => t.id !== id)
    total.value--
  }

  const fetchStatistics = async () => {
    const { data } = await todoApi.getStatistics()
    statistics.value = data
    return data
  }

  return {
    todos,
    total,
    loading,
    statistics,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    fetchStatistics,
  }
})

