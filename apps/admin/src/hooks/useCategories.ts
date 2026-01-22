import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@ecommerce/shared'

export const useCategories = (parentId?: string | null) => {
  return useQuery({
    queryKey: ['categories', parentId],
    queryFn: async () => {
      const params = parentId !== undefined ? { parentId: parentId || null } : {}
      const { data } = await api.get('/categories', { params })
      return data.data as Category[]
    },
  })
}

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const { data } = await api.get(`/categories/${id}`)
      return data.data as Category
    },
    enabled: !!id,
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (category: CreateCategoryInput) => {
      const { data } = await api.post('/categories', category)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...category }: { id: string } & UpdateCategoryInput) => {
      const { data } = await api.patch(`/categories/${id}`, category)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/categories/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
