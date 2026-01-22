import { useParams, useNavigate } from 'react-router-dom'
import { useOrder, useUpdateOrderStatus, useAddOrderNote } from '../hooks/useOrders'
import { ArrowLeft, Save, Mail, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '@ecommerce/shared'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: order, isLoading } = useOrder(id || '')
  const updateStatus = useUpdateOrderStatus()
  const addNote = useAddOrderNote()

  const [newStatus, setNewStatus] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [isCustomerNote, setIsCustomerNote] = useState(false)

  const handleStatusUpdate = async () => {
    if (newStatus && newStatus !== order?.status) {
      await updateStatus.mutateAsync({ id: id!, status: newStatus })
      setNewStatus('')
    }
  }

  const handleAddNote = async () => {
    if (noteContent.trim()) {
      await addNote.mutateAsync({ id: id!, content: noteContent, isCustomerNote })
      setNoteContent('')
      setIsCustomerNote(false)
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading order...</div>
  }

  if (!order) {
    return <div className="p-8">Order not found</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-600 mt-1">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">SKU</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Qty</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Price</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">{item.nameSnapshot}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.skuSnapshot || '-'}</td>
                    <td className="px-4 py-3 text-right">{item.qty}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.price, 'USD')}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total, 'USD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Notes</h2>
            <div className="space-y-4">
              {order.notes.map((note, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {note.isCustomerNote ? 'Customer Note' : 'Internal Note'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{note.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isCustomerNote}
                    onChange={(e) => setIsCustomerNote(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Send to customer
                </label>
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Order Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newStatus || order.status}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending_payment">Pending payment</option>
                  <option value="processing">Processing</option>
                  <option value="on_hold">On hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              {newStatus && newStatus !== order.status && (
                <button
                  onClick={handleStatusUpdate}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Status
                </button>
              )}
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Billing Address</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
              {order.billingAddress.company && <p>{order.billingAddress.company}</p>}
              <p>{order.billingAddress.address1}</p>
              {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
              <p>
                {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postcode}
              </p>
              <p>{order.billingAddress.country}</p>
              {order.billingAddress.phone && <p>{order.billingAddress.phone}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Shipping Address</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
              <p>{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postcode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
          </div>
          </div>

          {/* Order Totals */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Order Totals</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal, 'USD')}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discountTotal, 'USD')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{formatCurrency(order.shippingTotal, 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(order.taxTotal, 'USD')}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(order.grandTotal, 'USD')}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Payment</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Method:</span> {order.payment.methodTitle}
              </div>
              <div>
                <span className="text-gray-600">Status:</span> {order.payment.status}
              </div>
              {order.payment.transactionId && (
                <div>
                  <span className="text-gray-600">Transaction ID:</span> {order.payment.transactionId}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
