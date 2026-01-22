import { useParams, useNavigate } from 'react-router-dom'
import { useCustomer } from '../hooks/useCustomers'
import { ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@ecommerce/shared'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useCustomer(id || '')

  if (isLoading) {
    return <div className="p-8">Loading customer...</div>
  }

  if (!data || !data.customer) {
    return <div className="p-8">Customer not found</div>
  }

  const { customer, orders } = data

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-600 mt-1">{customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{customer.ordersCount || 0}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(customer.totalSpend || 0, 'USD')}
                </div>
                <div className="text-sm text-gray-600">Total Spend</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(customer.avgOrderValue || 0, 'USD')}
                </div>
                <div className="text-sm text-gray-600">Average Order Value</div>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order History</h2>
            {orders && orders.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Order</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order: any) => (
                    <tr key={order._id}>
                      <td className="px-4 py-3">
                        <a
                          href={`/orders/${order._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          #{order.orderNumber}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(order.grandTotal, 'USD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No orders yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Email:</span> {customer.email}
              </div>
              {customer.phone && (
                <div>
                  <span className="text-gray-600">Phone:</span> {customer.phone}
                </div>
              )}
              <div>
                <span className="text-gray-600">Member since:</span>{' '}
                {new Date(customer.createdAt).toLocaleDateString()}
              </div>
              {customer.lastActiveAt && (
                <div>
                  <span className="text-gray-600">Last active:</span>{' '}
                  {new Date(customer.lastActiveAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Billing Address */}
          {customer.addresses?.billing && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Billing Address</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  {customer.addresses.billing.firstName} {customer.addresses.billing.lastName}
                </p>
                {customer.addresses.billing.company && <p>{customer.addresses.billing.company}</p>}
                <p>{customer.addresses.billing.address1}</p>
                {customer.addresses.billing.address2 && <p>{customer.addresses.billing.address2}</p>}
                <p>
                  {customer.addresses.billing.city}, {customer.addresses.billing.state}{' '}
                  {customer.addresses.billing.postcode}
                </p>
                <p>{customer.addresses.billing.country}</p>
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {customer.addresses?.shipping && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Shipping Address</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  {customer.addresses.shipping.firstName} {customer.addresses.shipping.lastName}
                </p>
                {customer.addresses.shipping.company && <p>{customer.addresses.shipping.company}</p>}
                <p>{customer.addresses.shipping.address1}</p>
                {customer.addresses.shipping.address2 && <p>{customer.addresses.shipping.address2}</p>}
                <p>
                  {customer.addresses.shipping.city}, {customer.addresses.shipping.state}{' '}
                  {customer.addresses.shipping.postcode}
                </p>
                <p>{customer.addresses.shipping.country}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
