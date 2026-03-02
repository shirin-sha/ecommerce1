import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useCart } from '../context/CartContext'

// Helper to build full image URL from relative paths using API base from env
const getImageUrl = (imagePath?: string): string | undefined => {
  if (!imagePath) return undefined
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  if (imagePath.startsWith('/')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
    const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '')
    return baseUrl + imagePath
  }
  return imagePath
}

export default function Home() {
  const { data: productsData, isLoading: productsLoading } = useProducts({ featured: true, limit: 4 })
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const { addToCart } = useCart()

  const products = productsData?.data || []
  const featuredCategories = categories?.slice(0, 3) || []

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
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to E-Commerce</h1>
          <p className="text-xl mb-8">Discover amazing products at great prices</p>
          <Link
            to="/shop"
            className="inline-block bg-white text-yellow-700 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-50 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Categories</h2>
        {categoriesLoading ? (
          <div className="text-center">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCategories.map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${category._id}`}
                className="group rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow bg-gray-100"
              >
                <div className="relative h-64 md:h-80 bg-gray-200">
                  {category.image ? (
                    <img
                      src={getImageUrl(category.image)}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="text-lg font-semibold">{category.name}</p>
                    {category.description && (
                      <p className="text-xs text-gray-200 mt-1 line-clamp-2">{category.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          {productsLoading ? (
            <div className="text-center">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-600">No featured products available</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product: any) => (
                <div key={product._id} className="bg-white rounded-lg shadow p-4">
                  <Link to={`/products/${product.slug}`}>
                    <div className="bg-gray-200 rounded-lg h-48 mb-4 overflow-hidden">
                      {product.featuredImage ? (
                        <img
                          src={getImageUrl(product.featuredImage)}
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
                    <h3 className="font-semibold mb-2 hover:text-yellow-700">{product.title}</h3>
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
                        <span className="text-lg font-bold text-yellow-700">${product.regularPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-yellow-500 text-gray-900 px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
