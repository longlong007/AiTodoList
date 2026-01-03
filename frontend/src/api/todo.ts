import api from './index'
import type { Todo, CreateTodoDto, UpdateTodoDto, TodoStatistics } from '@/types'

export const todoApi = {
  // 获取待办列表
  getAll: (params?: {
    page?: number
    limit?: number
    status?: string
    importance?: string
    urgency?: number
    sortBy?: string
  }) => api.get<{ data: Todo[]; total: number }>('/todos', { params }),

  // 获取单个待办
  getOne: (id: string) => api.get<Todo>(`/todos/${id}`),

  // 创建待办
  create: (data: CreateTodoDto) => api.post<Todo>('/todos', data),

  // 更新待办
  update: (id: string, data: UpdateTodoDto) => api.put<Todo>(`/todos/${id}`, data),

  // 删除待办
  delete: (id: string) => api.delete(`/todos/${id}`),

  // 获取统计数据
  getStatistics: () => api.get<TodoStatistics>('/todos/statistics'),
}

