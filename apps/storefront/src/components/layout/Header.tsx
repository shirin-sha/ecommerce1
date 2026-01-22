import { Link } from 'react-router-dom'
import { ShoppingCart, User, Search } from 'lucide-react'
import { useCart } from '../../context/CartContext'

export default function Header() {
  const { itemCount } = useCart()

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gray-900">
            E-Commerce
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link to="/shop" className="text-gray-700 hover:text-gray-900">
              Shop
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-700 hover:text-gray-900">
              <Search className="w-5 h-5" />
            </button>
            <Link to="/my-account" className="text-gray-700 hover:text-gray-900">
              <User className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="text-gray-700 hover:text-gray-900 relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
