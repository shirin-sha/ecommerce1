import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  MessageSquare,
  Tag,
  BarChart3,
  LineChart,
  Settings,
  UserCog,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    subItems: [
      { name: 'All Products', href: '/products' },
      { name: 'Add New', href: '/products/new' },
      { name: 'Categories', href: '/products/categories' },
      { name: 'Tags', href: '/products/tags' },
      { name: 'Attributes', href: '/products/attributes' },
    ],
  },
  { name: 'Reviews', href: '/reviews', icon: MessageSquare },
  { name: 'Marketing', href: '/marketing/coupons', icon: Tag },
  { name: 'Reports', href: '/reports/orders', icon: BarChart3 },
  { name: 'Analytics', href: '/analytics/overview', icon: LineChart },
  { name: 'Settings', href: '/settings/general', icon: Settings },
  { name: 'Users', href: '/users', icon: UserCog },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">E-Commerce</h1>
        <p className="text-sm text-gray-400 mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
                {item.subItems && isActive && (
                  <ul className="ml-8 mt-2 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.href
                      return (
                        <li key={subItem.name}>
                          <Link
                            to={subItem.href}
                            className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                              isSubActive
                                ? 'bg-blue-700 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
