import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

interface AnalyticsParams {
  dateFrom?: string
  dateTo?: string
  comparePeriod?: boolean
}

export const useOverviewAnalytics = (params: AnalyticsParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'overview', params],
    queryFn: async () => {
      const { data } = await api.get('/analytics/overview', { params })
      return data.data
    },
  })
}

export const useProductAnalytics = (params: AnalyticsParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'products', params],
    queryFn: async () => {
      const { data } = await api.get('/analytics/products', { params })
      return data.data
    },
  })
}

export const useCategoryAnalytics = (params: AnalyticsParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'categories', params],
    queryFn: async () => {
      const { data } = await api.get('/analytics/categories', { params })
      return data.data
    },
  })
}

export const useStockAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'stock'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/stock')
      return data.data
    },
  })
}
