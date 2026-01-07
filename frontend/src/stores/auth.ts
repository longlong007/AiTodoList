import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(
    localStorage.getItem('user') 
      ? JSON.parse(localStorage.getItem('user')!) 
      : null
  )

  const isAuthenticated = computed(() => !!token.value)

  const setAuth = (accessToken: string, userData: User) => {
    token.value = accessToken
    user.value = userData
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const loginWithEmail = async (email: string, password: string) => {
    const { data } = await authApi.loginWithEmail(email, password)
    setAuth(data.access_token, data.user)
    return data
  }

  const loginWithPhone = async (phone: string, password: string) => {
    const { data } = await authApi.loginWithPhone(phone, password)
    setAuth(data.access_token, data.user)
    return data
  }

  const loginWithWechat = async (code: string) => {
    const { data } = await authApi.loginWithWechat(code)
    setAuth(data.access_token, data.user)
    return data
  }

  const registerWithEmail = async (email: string, password: string) => {
    const { data } = await authApi.registerWithEmail(email, password)
    setAuth(data.access_token, data.user)
    return data
  }

  const registerWithPhone = async (phone: string, password: string) => {
    const { data } = await authApi.registerWithPhone(phone, password)
    setAuth(data.access_token, data.user)
    return data
  }

  const logout = () => {
    clearAuth()
  }

  // 刷新用户信息（用于支付成功后更新Pro状态）
  const refreshUser = async () => {
    if (!token.value) return
    
    try {
      const { data } = await authApi.getCurrentUser()
      user.value = data
      localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      throw error
    }
  }

  // 获取当前用户信息（用于 OAuth 回调）
  const fetchCurrentUser = async () => {
    try {
      const { data } = await authApi.getCurrentUser()
      user.value = data
      localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      clearAuth()
      throw error
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    loginWithEmail,
    loginWithPhone,
    loginWithWechat,
    registerWithEmail,
    registerWithPhone,
    logout,
    refreshUser,
    fetchCurrentUser,
  }
})

