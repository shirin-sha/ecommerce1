import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useCart } from '../context/CartContext'

export default function Shop() {
  const [searchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  )

  const { data: productsData, isLoading: productsLoading } = useProducts({
    limit: 20,
    categoryIds: selectedCategory || undefined,
  })
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const { addToCart } = useCart()

  const products = productsData?.data || []

  const handleAddToCart = (product: any) => {
    addToCart({
      productId: product._id,
      name: product.title,
      slug: product.slug,
      price: product.salePrice || product.regularPrice,
      image: product.featuredImage,
      sku: product.sku,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shop</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-4">Categories</h2>
            {categoriesLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded ${
                      !selectedCategory
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Categories
                  </button>
                </li>
                {categories?.map((category) => (
                  <li key={category._id}>
                    <button
                      onClick={() => setSelectedCategory(category._id)}
                      className={`w-full text-left px-3 py-2 rounded ${
                        selectedCategory === category._id
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        <div className="lg:col-span-3">
          {productsLoading ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-center">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-center">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <div key={product._id} className="bg-white rounded-lg shadow p-4">
                  <Link to={`/products/${product.slug}`}>
                    <div className="bg-gray-200 rounded-lg h-48 mb-4 overflow-hidden">
                      {product.featuredImage ? (
                        <img
                          src={product.featuredImage}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-semibold mb-2 hover:text-blue-600">{product.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {product.shortDescription || 'No description available'}
                    </p>
                  </Link>
                  <div className="flex items-center justify-between">
                    <div>
                      {product.salePrice ? (
                        <div>
                          <span className="text-lg font-bold text-red-600">${product.salePrice}</span>
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ${product.regularPrice}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-blue-600">${product.regularPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
