import api from './index'
import type { Plan, Order, PaymentMethod, PlanType } from '@/types'

export const paymentApi = {
  // 获取套餐列表
  getPlans: () => api.get<Plan[]>('/payment/plans'),

  // 创建订单
  createOrder: (planType: PlanType, paymentMethod: PaymentMethod) =>
    api.post<{
      orderNo: string
      amount: number
      amountDisplay: string
      payUrl: string
      status: string
    }>('/payment/order', { planType, paymentMethod }),

  // 查询订单状态
  getOrder: (orderNo: string) => api.get<Order>(`/payment/order/${orderNo}`),

  // 获取订单列表
  getOrders: () => api.get<Order[]>('/payment/orders'),
}

