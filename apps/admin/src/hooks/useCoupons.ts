import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Coupon } from '@ecommerce/shared'

interface CouponsParams {
  page?: number
  limit?: number
  search?: string
}

export const useCoupons = (params: CouponsParams = {}) => {
  return useQuery({
    queryKey: ['coupons', params],
    queryFn: async () => {
      const { data } = await api.get('/coupons', { params })
      return data
    },
  })
}

export const useCoupon = (id: string) => {
  return useQuery({
    queryKey: ['coupon', id],
    queryFn: async () => {
      const { data } = await api.get(`/coupons/${id}`)
      return data.data as Coupon
    },
    enabled: !!id,
  })
}

export const useCreateCoupon = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (coupon: any) => {
      const { data } = await api.post('/coupons', coupon)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...coupon }: { id: string } & any) => {
      const { data } = await api.patch(`/coupons/${id}`, coupon)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      queryClient.invalidateQueries({ queryKey: ['coupon', variables.id] })
    },
  })
}

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/coupons/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}
