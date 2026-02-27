import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { useAttribute, useAttributeTerms, useCreateAttributeTerm } from '../hooks/useAttributes'

type TermFormValues = {
  name: string
  slug?: string
}

export default function AttributeTerms() {
  const { id } = useParams<{ id: string }>()
  const attributeId = id || ''

  const { data: attribute, isLoading: isAttributeLoading } = useAttribute(attributeId)
  const { data: terms, isLoading: isTermsLoading } = useAttributeTerms(attributeId)
  const createTerm = useCreateAttributeTerm()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TermFormValues>({
    defaultValues: {
      name: '',
      slug: '',
    },
  })

  const onSubmit = async (data: TermFormValues) => {
    if (!attributeId) return
    try {
      await createTerm.mutateAsync({
        attributeId,
        term: {
          name: data.name,
          slug: data.slug || undefined,
        },
      })
      reset()
    } catch (error) {
      console.error('Error creating attribute term:', error)
    }
  }

  if (!attributeId) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Attribute terms</h1>
        <p className="text-gray-600">No attribute selected.</p>
      </div>
    )
  }

  const title = attribute ? attribute.name : 'Attribute'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{title} terms</h1>
          <p className="text-sm text-gray-500">
            Add terms for the <span className="font-medium">{title}</span> attribute. These can then be used on products
            and variations.
          </p>
        </div>
        <Link
          to="/products/attributes"
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          ← Back to attributes
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add new term form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Add new {title}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                <input
                  {...register('slug')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The “slug” is the URL-friendly version of the name. It is usually all lowercase and contains only
                  letters, numbers, and hyphens.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                disabled={createTerm.isPending}
              >
                {createTerm.isPending ? 'Adding…' : 'Add new term'}
              </button>
            </form>
          </div>
        </div>

        {/* Terms list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <select className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700">
                  <option>Bulk actions</option>
                </select>
                <button
                  type="button"
                  className="px-3 py-1 text-sm border border-gray-300 rounded bg-gray-50 hover:bg-gray-100"
                  disabled
                >
                  Apply
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder={`Search ${title}`}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>

            {isTermsLoading || isAttributeLoading ? (
              <div className="p-8 text-center text-gray-500">Loading terms...</div>
            ) : !terms || terms.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No terms found. Add your first term on the left.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" disabled />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {terms.map((term) => (
                    <tr key={term._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" disabled />
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600">{term.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">—</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{term.slug}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">0</td>
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

