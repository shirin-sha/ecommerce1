import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Order } from '@ecommerce/shared'

interface OrdersParams {
  page?: number
  limit?: number
  status?: string
  search?: string
  customerId?: string
  dateFrom?: string
  dateTo?: string
}

export const useOrders = (params: OrdersParams = {}) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params })
      return data
    },
  })
}

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`)
      return data.data as Order
    },
    enabled: !!id,
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/orders/${id}/status`, { status })
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
    },
  })
}

export const useAddOrderNote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content, isCustomerNote }: { id: string; content: string; isCustomerNote?: boolean }) => {
      const { data } = await api.post(`/orders/${id}/notes`, { content, isCustomerNote })
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
    },
  })
}
