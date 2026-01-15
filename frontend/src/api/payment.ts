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

  // ==================== Stripe 支付接口 ====================

  // 创建 Stripe 订阅 Checkout Session
  createStripeSubscription: (planType: PlanType, mode: 'subscription' | 'payment' = 'subscription') =>
    api.post<{
      sessionId: string
      checkoutUrl: string
    }>('/payment/stripe/subscription', { planType, mode }),

  // 验证 Stripe Checkout Session 状态
  verifyStripeSession: (sessionId: string) =>
    api.get<{
      status: string
      customerEmail: string
      amountTotal: number
      currency: string
      mode: string
      subscriptionStatus: string
    }>(`/payment/stripe/verify/${sessionId}`),

  // 获取 Stripe 配置状态
  getStripeStatus: () =>
    api.get<{
      configured: boolean
      supportedMethods: string[]
    }>('/payment/stripe/status'),

  // 创建 Stripe Billing Portal Session（管理订阅）
  createStripePortal: () =>
    api.post<{ url: string }>('/payment/stripe/portal'),

  // 取消 Stripe 订阅
  cancelStripeSubscription: () =>
    api.post<{
      success: boolean
      cancelAt: string
      message: string
    }>('/payment/stripe/cancel-subscription'),
}

