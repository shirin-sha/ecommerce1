import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export interface Attribute {
  _id: string
  name: string
  slug: string
  type: string
  orderBy: string
  hasArchives: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AttributeTerm {
  _id: string
  attributeId: string
  name: string
  slug: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export const useAttributes = () => {
  return useQuery({
    queryKey: ['attributes'],
    queryFn: async () => {
      const { data } = await api.get('/attributes')
      return data.data as Attribute[]
    },
  })
}

export const useAttribute = (id: string) => {
  return useQuery({
    queryKey: ['attribute', id],
    queryFn: async () => {
      const { data } = await api.get(`/attributes/${id}`)
      return data.data as Attribute
    },
    enabled: !!id,
  })
}

export const useAttributeTerms = (attributeId: string) => {
  return useQuery({
    queryKey: ['attribute-terms', attributeId],
    queryFn: async () => {
      const { data } = await api.get(`/attributes/${attributeId}/terms`)
      return data.data as AttributeTerm[]
    },
    enabled: !!attributeId,
  })
}

export const useCreateAttribute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (attribute: { name: string; slug?: string; type?: string; orderBy?: string; hasArchives?: boolean }) => {
      const { data } = await api.post('/attributes', attribute)
      return data.data as Attribute
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
    },
  })
}

export const useCreateAttributeTerm = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ attributeId, term }: { attributeId: string; term: { name: string; slug?: string; sortOrder?: number } }) => {
      const { data } = await api.post(`/attributes/${attributeId}/terms`, term)
      return data.data as AttributeTerm
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attribute-terms', variables.attributeId] })
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
    },
  })
}
