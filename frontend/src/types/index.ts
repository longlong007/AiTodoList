export type Importance = 'A' | 'B' | 'C' | 'D'
export type Urgency = 1 | 2 | 3 | 4 | 5
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type LoginType = 'phone' | 'email' | 'wechat'

export interface User {
  id: string
  phone?: string
  email?: string
  nickname?: string
  avatar?: string
  loginType: LoginType
}

export interface Todo {
  id: string
  title: string
  description?: string
  importance: Importance
  urgency: number
  status: TodoStatus
  dueDate?: string
  completedAt?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTodoDto {
  title: string
  description?: string
  importance?: Importance
  urgency?: number
  dueDate?: string
}

export interface UpdateTodoDto {
  title?: string
  description?: string
  importance?: Importance
  urgency?: number
  status?: TodoStatus
  dueDate?: string
}

export interface TodoStatistics {
  total: number
  completed: number
  pending: number
  inProgress: number
  cancelled: number
  completionRate: number
  completedOnTime: number
  byImportance: Record<Importance, number>
  byUrgency: Record<number, number>
  recentTodos: Todo[]
}

export interface AuthResponse {
  access_token: string
  user: User
}

