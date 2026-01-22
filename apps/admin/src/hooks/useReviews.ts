import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Review } from '@ecommerce/shared'

interface ReviewsParams {
  page?: number
  limit?: number
  status?: string
  productId?: string
  search?: string
}

export const useReviews = (params: ReviewsParams = {}) => {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: async () => {
      const { data } = await api.get('/reviews', { params })
      return data
    },
  })
}

export const useReview = (id: string) => {
  return useQuery({
    queryKey: ['review', id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${id}`)
      return data.data as Review
    },
    enabled: !!id,
  })
}

export const useModerateReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/reviews/${id}`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useDeleteReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/reviews/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useReplyToReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data } = await api.post(`/reviews/${id}/reply`, { content })
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['review', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}
