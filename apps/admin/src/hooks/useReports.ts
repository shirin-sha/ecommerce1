import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

interface ReportsParams {
  dateFrom?: string
  dateTo?: string
  groupBy?: 'day' | 'month' | 'year'
  status?: string
  category?: string
}

export const useOrdersReport = (params: ReportsParams = {}) => {
  return useQuery({
    queryKey: ['reports', 'orders', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/orders', { params })
      return data.data
    },
  })
}

export const useCustomersReport = (params: ReportsParams = {}) => {
  return useQuery({
    queryKey: ['reports', 'customers', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/customers', { params })
      return data.data
    },
  })
}

export const useStockReport = (params: ReportsParams = {}) => {
  return useQuery({
    queryKey: ['reports', 'stock', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/stock', { params })
      return data.data
    },
  })
}
