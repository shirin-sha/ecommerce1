import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOrders, useUpdateOrderStatus } from '../hooks/useOrders'
import { Search, Filter, MoreVertical, Eye, Edit } from 'lucide-react'
import { Order } from '@ecommerce/shared'
import { formatCurrency } from '@ecommerce/shared'

export default function Orders() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  const { data, isLoading } = useOrders({
    page,
    limit: 20,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: search || undefined,
  })

  const updateStatus = useUpdateOrderStatus()

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (confirm(`Change order status to ${newStatus}?`)) {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.pending_payment}`}>
        {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    )
  }

  const statusCounts = {
    all: data?.pagination?.total || 0,
    pending_payment: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    refunded: 0,
    failed: 0,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Order
        </button>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('pending_payment')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'pending_payment'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Pending payment ({statusCounts.pending_payment})
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'processing'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Processing ({statusCounts.processing})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'completed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Completed ({statusCounts.completed})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'cancelled'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Cancelled ({statusCounts.cancelled})
            </button>
            <button
              onClick={() => setStatusFilter('refunded')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'refunded'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Refunded ({statusCounts.refunded})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'failed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Failed ({statusCounts.failed})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 flex flex-wrap gap-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>Bulk actions</option>
          </select>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Apply</button>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          <input
            type="text"
            placeholder="Filter by registered customer"
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Filter</button>
          <div className="flex-1"></div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search orders
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input type="checkbox" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ship to
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.data?.map((order: Order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/orders/${order._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        #{order.orderNumber}
                      </Link>
                      <div className="text-sm text-gray-500">{order.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-gray-300"
                      >
                        <option value="pending_payment">Pending payment</option>
                        <option value="processing">Processing</option>
                        <option value="on_hold">On hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{order.billingAddress.firstName} {order.billingAddress.lastName}</div>
                      <div className="text-xs text-gray-400">
                        {order.billingAddress.address1}, {order.billingAddress.city}
                      </div>
                      <div className="text-xs text-gray-400">via {order.payment.methodTitle}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(order.grandTotal, 'USD')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Link
                          to={`/orders/${order._id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/orders/${order._id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.attribution?.source || 'Direct'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data?.pagination && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  {data.pagination.total} items
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-1 text-sm">
                    {data.pagination.page} of {data.pagination.totalPages}
                  </span>
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
