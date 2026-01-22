import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { User } from '@ecommerce/shared'

interface CustomersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
}

export const useCustomers = (params: CustomersParams = {}) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const { data } = await api.get('/customers', { params })
      return data
    },
  })
}

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...customer }: { id: string } & Partial<User>) => {
      const { data } = await api.patch(`/customers/${id}`, customer)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] })
    },
  })
}
