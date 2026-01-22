import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { Product } from '@ecommerce/shared'

interface ProductsParams {
  page?: number
  limit?: number
  categoryIds?: string
  tagIds?: string
  search?: string
  featured?: boolean
  status?: string
}

export const useProducts = (params: ProductsParams = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: { ...params, status: 'published' },
      })
      return data
    },
  })
}

export const useProduct = (idOrSlug: string, type: 'id' | 'slug' = 'slug') => {
  return useQuery({
    queryKey: ['product', type, idOrSlug],
    queryFn: async () => {
      const endpoint = type === 'slug' ? `/products/slug/${idOrSlug}` : `/products/${idOrSlug}`
      const { data } = await api.get(endpoint)
      return data.data as Product
    },
    enabled: !!idOrSlug,
  })
}

export const useProductVariations = (productId: string) => {
  return useQuery({
    queryKey: ['product-variations', productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}/variations`)
      return data.data
    },
    enabled: !!productId,
  })
}
