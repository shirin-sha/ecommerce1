import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { createAttributeSchema, CreateAttributeInput } from '@ecommerce/shared'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Attributes() {
  const queryClient = useQueryClient()

  const { data: attributes, isLoading } = useQuery({
    queryKey: ['attributes'],
    queryFn: async () => {
      const { data } = await api.get('/attributes')
      return data.data
    },
  })

  const createAttribute = useMutation({
    mutationFn: async (attribute: CreateAttributeInput) => {
      const { data } = await api.post('/attributes', attribute)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAttributeInput>({
    resolver: zodResolver(createAttributeSchema),
  })

  const onSubmit = async (data: CreateAttributeInput) => {
    try {
      await createAttribute.mutateAsync(data)
      reset()
    } catch (error) {
      console.error('Error creating attribute:', error)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Attributes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Attribute Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Attribute</h2>
            <p className="text-sm text-gray-600 mb-4">
              Attributes let you define extra product data, such as size or color. You can use these attributes in the
              shop sidebar using the "layered nav" widgets.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name for the attribute (shown on the front-end)"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                <input
                  {...register('slug')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unique slug/reference for the attribute"
                  maxLength={28}
                />
              </div>

              <div className="flex items-center">
                <input
                  {...register('hasArchives')}
                  type="checkbox"
                  id="hasArchives"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasArchives" className="ml-2 text-sm text-gray-700">
                  Enable Archives?
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Enable this if you want this attribute to have product archives in your store.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="select">Select</option>
                  <option value="colour">Colour</option>
                  <option value="image">Image</option>
                  <option value="button">Button</option>
                  <option value="radio">Radio</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Determines how this attribute's values are displayed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Sort Order</label>
                <select
                  {...register('orderBy')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="menu_order">Custom ordering</option>
                  <option value="name">Name</option>
                  <option value="id">Term ID</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Determines the sort order of the terms on the frontend shop product pages. If using custom ordering,
                  you can drag and drop the terms in this attribute.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Attribute
              </button>
            </form>
          </div>
        </div>

        {/* Attributes List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading attributes...</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order by
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Terms
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attributes?.map((attr: any) => (
                    <tr key={attr._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/products/attributes/${attr._id}/terms`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {attr.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{attr.slug}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {attr.type} {attr.hasArchives ? '(Public)' : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{attr.orderBy}</td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/products/attributes/${attr._id}/terms`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Configure terms
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
