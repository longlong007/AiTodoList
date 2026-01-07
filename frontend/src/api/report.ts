import api from './index'

export interface Report {
  id: string
  title: string
  content: string
  statisticsData?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateReportDto {
  title: string
  content: string
  statisticsData?: string
}

export const reportApi = {
  // 创建报告
  create: (data: CreateReportDto) => api.post('/reports', data),

  // 获取所有报告列表
  getAll: () => api.get<Report[]>('/reports'),

  // 获取单个报告
  getOne: (id: string) => api.get<Report>(`/reports/${id}`),

  // 删除报告
  delete: (id: string) => api.delete(`/reports/${id}`),

  // 下载PDF
  downloadPdf: (id: string) => {
    return api.get(`/reports/${id}/pdf`, {
      responseType: 'blob',
    })
  },
}

