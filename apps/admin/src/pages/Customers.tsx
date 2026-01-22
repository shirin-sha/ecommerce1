import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCustomers } from '../hooks/useCustomers'
import { Search, Download, MoreVertical } from 'lucide-react'
import { User } from '@ecommerce/shared'
import { formatCurrency } from '@ecommerce/shared'

export default function Customers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useCustomers({
    page,
    limit: 25,
    search: search || undefined,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Customers</option>
            <option value="registered">Registered</option>
            <option value="guest">Guest</option>
          </select>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading customers...</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total spend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AOV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country / Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.data?.map((customer: User) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        to={`/customers/${customer._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{customer.email.split('@')[0]}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.lastActiveAt
                        ? new Date(customer.lastActiveAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                        {customer.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{customer.ordersCount || 0}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatCurrency(customer.totalSpend || 0, 'USD')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatCurrency(customer.avgOrderValue || 0, 'USD')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.addresses?.billing?.country || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.addresses?.billing?.city || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data?.pagination && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <input
                    type="number"
                    value={page}
                    onChange={(e) => setPage(parseInt(e.target.value) || 1)}
                    min={1}
                    max={data.pagination.totalPages}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  />
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data.pagination.page >= data.pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
                <div className="text-sm text-gray-700">
                  Rows per page: 25
                </div>
              </div>
            )}

            {/* Summary */}
            {data?.data && data.data.length > 0 && (
              <div className="bg-gray-50 px-6 py-4 border-t text-sm text-gray-700">
                <div className="flex gap-6">
                  <span>
                    {data.pagination?.total || 0} customers
                  </span>
                  <span>
                    {(data.data.reduce((sum: number, c: User) => sum + (c.ordersCount || 0), 0) / (data.data.length || 1)).toFixed(2)} Average orders
                  </span>
                  <span>
                    {formatCurrency(
                      data.data.reduce((sum: number, c: User) => sum + (c.totalSpend || 0), 0) / (data.data.length || 1),
                      'USD'
                    )} Average lifetime spend
                  </span>
                  <span>
                    {formatCurrency(
                      data.data.reduce((sum: number, c: User) => sum + (c.avgOrderValue || 0), 0) / (data.data.length || 1),
                      'USD'
                    )} Average order value
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
