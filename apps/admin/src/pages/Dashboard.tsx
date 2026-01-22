import { useOverviewAnalytics, useProductAnalytics, useStockAnalytics } from '../hooks/useAnalytics'
import { useOrders } from '../hooks/useOrders'
import { formatCurrency } from '@ecommerce/shared'
import { TrendingUp, ShoppingCart, DollarSign, Package, ArrowUp, ArrowDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useOverviewAnalytics({
    comparePeriod: true,
  })
  const { data: topProducts } = useProductAnalytics()
  const { data: stockData } = useStockAnalytics()
  const { data: recentOrders } = useOrders({ page: 1, limit: 5 })

  if (overviewLoading) {
    return <div className="p-8">Loading dashboard...</div>
  }

  const kpis = overview?.kpis || {}
  const revenue = kpis.revenue || {}
  const orders = kpis.orders || {}
  const aov = kpis.aov || {}

  const renderKPI = (title: string, current: number, change: number, icon: any, format: 'currency' | 'number' = 'number') => {
    const Icon = icon
    const isPositive = change >= 0
    const displayValue = format === 'currency' ? formatCurrency(current, 'USD') : current.toFixed(0)

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{displayValue}</p>
          </div>
          <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
            <Icon className={`w-6 h-6 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
          </div>
        </div>
        <div className="mt-4 flex items-center">
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-600">
          Last 30 days
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {renderKPI('Revenue', revenue.current || 0, revenue.change || 0, DollarSign, 'currency')}
        {renderKPI('Orders', orders.current || 0, orders.change || 0, ShoppingCart)}
        {renderKPI('Average Order Value', aov.current || 0, aov.change || 0, TrendingUp, 'currency')}
        {renderKPI('Products', stockData?.summary?.total || 0, 0, Package)}
      </div>

      {/* Charts & Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h2>
          <div className="h-64">
            {overview?.dailyRevenue && overview.dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overview.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="_id" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value, 'USD')}
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
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">No revenue data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {topProducts && topProducts.length > 0 ? (
              topProducts.slice(0, 5).map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.productName}</p>
                    <p className="text-sm text-gray-500">{product.quantitySold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(product.revenue, 'USD')}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Stock Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders && recentOrders.data && recentOrders.data.length > 0 ? (
              recentOrders.data.map((order: any) => (
                <div key={order._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <Link to={`/orders/${order._id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      #{order.orderNumber}
                    </Link>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.grandTotal, 'USD')}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent orders</p>
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Stock Alerts</h2>
            <Link to="/reports/stock" className="text-sm text-blue-600 hover:text-blue-800">
              View Report
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Low Stock</p>
                <p className="text-xs text-gray-600 mt-1">{stockData?.summary?.lowStock || 0} products</p>
              </div>
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Out of Stock</p>
                <p className="text-xs text-gray-600 mt-1">{stockData?.summary?.outOfStock || 0} products</p>
              </div>
              <Package className="w-5 h-5 text-red-600" />
            </div>
            {stockData?.lowStockProducts && stockData.lowStockProducts.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Products needing attention:</p>
                {stockData.lowStockProducts.slice(0, 3).map((product: any) => (
                  <div key={product._id} className="text-sm text-gray-600">
                    • {product.title} ({product.stockQty} left)
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
