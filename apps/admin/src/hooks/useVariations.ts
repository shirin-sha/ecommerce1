import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Variation } from '@ecommerce/shared'

export const useVariations = (productId: string) => {
  return useQuery({
    queryKey: ['variations', productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}/variations`)
      return data.data as Variation[]
    },
    enabled: !!productId,
  })
}

export const useGenerateVariations = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post(`/products/${productId}/variations/generate`)
      return data.data as Variation[]
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['variations', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}

export const useCreateVariation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, variation }: { productId: string; variation: Partial<Variation> }) => {
      const { data } = await api.post(`/products/${productId}/variations`, variation)
      return data.data as Variation
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['variations', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] })
    },
  })
}

export const useUpdateVariation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, varId, patch }: { productId: string; varId: string; patch: Partial<Variation> }) => {
      const { data } = await api.patch(`/products/${productId}/variations/${varId}`, patch)
      return data.data as Variation
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['variations', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] })
    },
  })
}

export const useDeleteVariation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, varId }: { productId: string; varId: string }) => {
      const { data } = await api.delete(`/products/${productId}/variations/${varId}`)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['variations', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] })
    },
  })
}

