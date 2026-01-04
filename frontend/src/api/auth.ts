import api from './index'
import type { AuthResponse, User } from '@/types'

export const authApi = {
  // 邮箱注册
  registerWithEmail: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/register/email', { identifier: email, password }),

  // 手机号注册
  registerWithPhone: (phone: string, password: string) =>
    api.post<AuthResponse>('/auth/register/phone', { identifier: phone, password }),

  // 邮箱登录
  loginWithEmail: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login/email', { identifier: email, password }),

  // 手机号登录
  loginWithPhone: (phone: string, password: string) =>
    api.post<AuthResponse>('/auth/login/phone', { identifier: phone, password }),

  // 微信登录
  loginWithWechat: (code: string) =>
    api.post<AuthResponse>('/auth/login/wechat', { code }),

  // 获取当前用户信息
  getCurrentUser: () =>
    api.get<User>('/user/profile'),
}

