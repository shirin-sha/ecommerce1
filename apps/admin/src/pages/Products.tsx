import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProducts, useDeleteProduct } from '../hooks/useProducts'
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react'
import { Product } from '@ecommerce/shared'
import api from '../lib/api'

export default function Products() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [authDebug, setAuthDebug] = useState<any>(null)

  // Debug: Check auth status and try to refresh if needed
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const { data } = await api.get('/auth/me')
          setAuthDebug({
            hasToken: true,
            user: data.data.user,
            isAdmin: data.data.user.role === 'admin' || data.data.user.role === 'shop_manager',
          })
        } catch (error: any) {
          // Token expired - try to refresh
          if (error.response?.status === 401) {
            try {
              const refreshResponse = await api.post('/auth/refresh', {}, { withCredentials: true })
              const newToken = refreshResponse.data.data.accessToken
              localStorage.setItem('accessToken', newToken)
              
              // Retry getting user info
              const { data } = await api.get('/auth/me')
              setAuthDebug({
                hasToken: true,
                user: data.data.user,
                isAdmin: data.data.user.role === 'admin' || data.data.user.role === 'shop_manager',
                refreshed: true,
              })
            } catch (refreshError: any) {
              // Refresh failed - need to login
              console.error('Token refresh failed:', refreshError)
              setAuthDebug({
                hasToken: true,
                error: `Token expired. Refresh failed: ${refreshError.response?.data?.error || refreshError.message || 'Unknown error'}. Please log in again.`,
                user: null,
                isAdmin: false,
                needsLogin: true,
              })
              // Clear invalid token
              localStorage.removeItem('accessToken')
            }
          } else {
            setAuthDebug({
              hasToken: true,
              error: error.message || 'Token invalid or expired',
              user: null,
              isAdmin: false,
            })
          }
        }
      } else {
        setAuthDebug({
          hasToken: false,
          user: null,
          isAdmin: false,
          needsLogin: true,
        })
      }
    }
    checkAuth()
  }, [])

  const { data, isLoading } = useProducts({
    page,
    limit: 20,
    search: search || undefined,
    // Explicitly pass 'all' to ensure cache key differentiation
    status: statusFilter,
  })

  const deleteProduct = useDeleteProduct()

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct.mutateAsync(id)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      private: 'bg-yellow-100 text-yellow-800',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getStockBadge = (product: Product) => {
    if (!product.manageStock) return <span className="text-gray-500">-</span>
    if (product.stockStatus === 'out_of_stock') {
      return <span className="text-red-600 font-medium">Out of stock</span>
    }
    return <span className="text-green-600 font-medium">In stock ({product.stockQty || 0})</span>
  }

  return (
    <div>
      {/* Debug Info - Remove after debugging */}
      {authDebug && (
        <div className={`mb-4 p-4 rounded-lg ${authDebug.isAdmin ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="text-sm flex items-center justify-between">
            <div>
              <strong>Auth Debug:</strong> Token: {authDebug.hasToken ? '✅ Present' : '❌ Missing'} | 
              Role: {authDebug.user?.role || 'N/A'} | 
              Is Admin: {authDebug.isAdmin ? '✅ Yes' : '❌ No'} | 
              Status Filter: {statusFilter}
              {authDebug.refreshed && <span className="text-green-600 ml-2"> | Token Refreshed!</span>}
              {authDebug.error && <span className="text-red-600"> | Error: {authDebug.error}</span>}
            </div>
            {authDebug.needsLogin && (
              <Link
                to="/login"
                className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Go to Login
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your products</p>
        </div>
        <Link
          to="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="private">Private</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            <option value="simple">Simple</option>
            <option value="variable">Variable</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All stock status</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="backorder">On backorder</option>
          </select>

          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input type="checkbox" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.data?.map((product: Product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.featuredImage ? (
                        <img
                          src={product.featuredImage}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          to={`/products/${product._id}/edit`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {product.title}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {product._id} |{' '}
                          <Link to={`/products/${product._id}/edit`} className="hover:underline">
                            Edit
                          </Link>{' '}
                          |{' '}
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStockBadge(product)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {product.salePrice ? (
                        <div>
                          <span className="text-red-600">${product.salePrice.toFixed(2)}</span>
                          <span className="text-gray-400 line-through ml-2">${product.regularPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        `$${product.regularPrice.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.categoryIds?.length > 0 ? (
                        <span>{product.categoryIds.length} category{product.categoryIds.length > 1 ? 'ies' : 'y'}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(product.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/products/${product._id}/edit`}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data?.pagination && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} products
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data.pagination.page >= data.pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
