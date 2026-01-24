import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { Category } from '@ecommerce/shared'

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories')
      return data.data as Category[]
    },
  })
}

export const useCategory = (idOrSlug: string, type: 'id' | 'slug' = 'slug') => {
  return useQuery({
    queryKey: ['category', type, idOrSlug],
    queryFn: async () => {
      const endpoint = type === 'slug' ? `/categories/slug/${idOrSlug}` : `/categories/${idOrSlug}`
      const { data } = await api.get(endpoint)
      return data.data as Category
    },
    enabled: !!idOrSlug,
  })
}
