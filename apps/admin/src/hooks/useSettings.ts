import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Settings } from '@ecommerce/shared'

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data.data as Settings
    },
  })
}

export const useUpdateGeneralSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<Settings['general']>) => {
      const { data } = await api.patch('/settings/general', { general: settings })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export const useUpdateProductSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<Settings['products']>) => {
      const { data } = await api.patch('/settings/products', { products: settings })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export const useUpdateInventorySettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<Settings['inventory']>) => {
      const { data } = await api.patch('/settings/inventory', { inventory: settings })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export const useUpdateShippingSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<Settings['shipping']>) => {
      const { data } = await api.patch('/settings/shipping', { shipping: settings })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export const useUpdatePaymentSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<Settings['payments']>) => {
      const { data } = await api.patch('/settings/payments', { payments: settings })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export const useUpdateEmailSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<Settings['emails']>) => {
      const { data } = await api.patch('/settings/emails', { emails: settings })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export const useUpdateSiteVisibility = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (siteVisibility: 'coming_soon' | 'live') => {
      const { data } = await api.patch('/settings/site-visibility', { siteVisibility })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
