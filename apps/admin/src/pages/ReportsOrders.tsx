import { useState } from 'react'
import { useOrdersReport } from '../hooks/useReports'
import { Download } from 'lucide-react'
import { formatCurrency } from '@ecommerce/shared'

export default function ReportsOrders() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('day')

  const { data, isLoading } = useOrdersReport({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    groupBy,
  })

  const handleExport = () => {
    // TODO: Export to CSV
    alert('Export functionality coming soon')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders Report</h1>
        <button
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data?.totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data.totals.orders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(data.totals.revenue, 'USD')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Shipping</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(data.totals.shipping, 'USD')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Discounts</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(data.totals.discount, 'USD')}
            </p>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading report...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipping
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discounts
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.breakdown?.map((row: any) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{row._id}</td>
                  <td className="px-6 py-4 text-right text-gray-900">{row.orders}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(row.revenue, 'USD')}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {formatCurrency(row.shipping, 'USD')}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600">
                    {formatCurrency(row.discount, 'USD')}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(row.netRevenue, 'USD')}
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
