export type Importance = 'A' | 'B' | 'C' | 'D'
export type Urgency = 1 | 2 | 3 | 4 | 5
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type LoginType = 'phone' | 'email' | 'wechat'
export type AccountType = 'free' | 'pro'
export type PaymentMethod = 'alipay' | 'wechat'
export type PlanType = 'monthly' | 'quarterly' | 'yearly'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'

export interface User {
  id: string
  phone?: string
  email?: string
  nickname?: string
  avatar?: string
  loginType: LoginType
  accountType: AccountType
  isPro: boolean
  subscriptionExpireAt?: string
}

export interface Plan {
  type: PlanType
  name: string
  price: number
  priceDisplay: string
  originalPrice?: string
  days: number
  discount?: string
  popular?: boolean
  features: string[]
}

export interface Order {
  orderNo: string
  planType: PlanType
  amount: number
  amountDisplay: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  payUrl?: string
  paidAt?: string
  createdAt: string
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

