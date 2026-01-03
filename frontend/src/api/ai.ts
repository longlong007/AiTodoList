import api from './index'

export const aiApi = {
  // 获取AI分析
  analyze: () => api.get<{ analysis: string }>('/ai/analyze'),
}

