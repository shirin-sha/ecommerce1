import { useState } from 'react'
import { useOverviewAnalytics } from '../hooks/useAnalytics'
import { formatCurrency } from '@ecommerce/shared'
import { DollarSign, ShoppingCart, TrendingUp, ArrowUp, ArrowDown, Download } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AnalyticsOverview() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [comparePeriod, setComparePeriod] = useState(true)

  const { data, isLoading } = useOverviewAnalytics({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    comparePeriod,
  })

  const renderKPI = (title: string, current: number, change: number, icon: any, format: 'currency' | 'number' = 'number') => {
    const Icon = icon
    const isPositive = change >= 0
    const displayValue = format === 'currency' ? formatCurrency(current, 'USD') : current.toFixed(0)

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
            <Icon className={`w-5 h-5 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{displayValue}</p>
        <div className="mt-2 flex items-center">
          {isPositive ? (
            <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
          ) : (
            <ArrowDown className="w-4 h-4 text-red-600 mr-1" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500 ml-2">vs previous period</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Date Range Filters */}
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
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={comparePeriod}
                onChange={(e) => setComparePeriod(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Compare previous period</span>
            </label>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {renderKPI('Total Revenue', data?.kpis?.revenue?.current || 0, data?.kpis?.revenue?.change || 0, DollarSign, 'currency')}
            {renderKPI('Total Orders', data?.kpis?.orders?.current || 0, data?.kpis?.orders?.change || 0, ShoppingCart)}
            {renderKPI('Average Order Value', data?.kpis?.aov?.current || 0, data?.kpis?.aov?.change || 0, TrendingUp, 'currency')}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h2>
            <div className="h-80">
              {data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="_id" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'Revenue') return formatCurrency(value, 'USD')
                        return value
                      }}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Revenue"
                      yAxisId="left"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Orders"
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">No data available for selected period</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Revenue Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Daily Breakdown</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.dailyRevenue?.map((row: any) => (
                  <tr key={row._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{row._id}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{row.orders}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(row.revenue, 'USD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
