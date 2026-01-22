import { useState } from 'react'
import { useStockReport } from '../hooks/useReports'
import { Download, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@ecommerce/shared'

export default function ReportsStock() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { data, isLoading } = useStockReport({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Stock Report</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Products</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data.summary.totalProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">In Stock</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">{data.summary.inStock}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <h3 className="text-sm font-medium text-gray-600">Low Stock</h3>
            <p className="text-2xl font-bold text-yellow-600 mt-2">{data.summary.lowStock}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
            <h3 className="text-sm font-medium text-gray-600">Out of Stock</h3>
            <p className="text-2xl font-bold text-red-600 mt-2">{data.summary.outOfStock}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'low_stock' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setStatusFilter('out_of_stock')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'out_of_stock' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading report...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.products?.map((product: any) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{product.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.sku || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-medium ${
                      product.stockQty <= 0 ? 'text-red-600' :
                      product.stockQty <= 5 ? 'text-yellow-600' :
                      'text-gray-900'
                    }`}>
                      {product.stockQty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      product.stockStatus === 'in_stock' ? 'bg-green-100 text-green-800' :
                      product.stockStatus === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.stockStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(product.regularPrice, 'USD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
