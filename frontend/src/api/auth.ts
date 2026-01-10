import api from './index'
import type { AuthResponse, User } from '@/types'

export const authApi = {
  // 邮箱注册
  registerWithEmail: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/register/email', { identifier: email, password }),

  // 手机号注册（支持验证码）
  registerWithPhone: (phone: string, password: string, code?: string) =>
    api.post<AuthResponse>('/auth/register/phone', { identifier: phone, password, code }),

  // 邮箱登录
  loginWithEmail: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login/email', { identifier: email, password }),

  // 手机号登录（支持密码或验证码登录）
  loginWithPhone: (phone: string, password?: string, code?: string) => {
    const payload: any = { identifier: phone }
    if (code) {
      // 验证码登录，不传password
      payload.code = code
    } else if (password) {
      // 密码登录
      payload.password = password
    }
    return api.post<AuthResponse>('/auth/login/phone', payload)
  },

  // 微信登录
  loginWithWechat: (code: string) =>
    api.post<AuthResponse>('/auth/login/wechat', { code }),

  // 发送短信验证码
  sendSmsCode: (phone: string, type: 'register' | 'login') =>
    api.post('/auth/sms/send', { phone, type }),

  // 验证短信验证码
  verifySmsCode: (phone: string, code: string, type: 'register' | 'login') =>
    api.post('/auth/sms/verify', { phone, code, type }),

  // 获取当前用户信息
  getCurrentUser: () =>
    api.get<User>('/user/profile'),
}

