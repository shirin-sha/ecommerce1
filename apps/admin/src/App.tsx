import { Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Products from './pages/Products'
import ProductEdit from './pages/ProductEdit'
import Categories from './pages/Categories'
import Tags from './pages/Tags'
import Attributes from './pages/Attributes'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Settings from './pages/Settings'
import SettingsGeneral from './pages/SettingsGeneral'
import Reviews from './pages/Reviews'
import Coupons from './pages/Coupons'
import ReportsOrders from './pages/ReportsOrders'
import ReportsCustomers from './pages/ReportsCustomers'
import ReportsStock from './pages/ReportsStock'
import AnalyticsOverview from './pages/AnalyticsOverview'
import AnalyticsProducts from './pages/AnalyticsProducts'
import Users from './pages/Users'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductEdit />} />
        <Route path="products/:id/edit" element={<ProductEdit />} />
        <Route path="products/categories" element={<Categories />} />
        <Route path="products/tags" element={<Tags />} />
        <Route path="products/attributes" element={<Attributes />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="settings/*" element={<Settings />} />
        <Route path="settings/:tab" element={<Settings />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="marketing/coupons" element={<Coupons />} />
        <Route path="reports/orders" element={<ReportsOrders />} />
        <Route path="reports/customers" element={<ReportsCustomers />} />
        <Route path="reports/stock" element={<ReportsStock />} />
        <Route path="analytics/overview" element={<AnalyticsOverview />} />
        <Route path="analytics/products" element={<AnalyticsProducts />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  )
}

export default App
