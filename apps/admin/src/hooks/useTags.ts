import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Tag, CreateTagInput } from '@ecommerce/shared'

export const useTags = (search?: string) => {
  return useQuery({
    queryKey: ['tags', search],
    queryFn: async () => {
      const params = search ? { search } : {}
      const { data } = await api.get('/tags', { params })
      return data.data as Tag[]
    },
  })
}

export const useCreateTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tag: CreateTagInput) => {
      const { data } = await api.post('/tags', tag)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
