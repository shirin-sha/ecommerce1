import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useCart } from '../context/CartContext'

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
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to E-Commerce</h1>
          <p className="text-xl mb-8">Discover amazing products at great prices</p>
          <Link
            to="/shop"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
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
                to={`/shop?category=${category.slug}`}
                className="bg-gray-200 rounded-lg h-64 flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <div className="text-center">
                  <p className="text-gray-800 text-xl font-semibold">{category.name}</p>
                  <p className="text-gray-600 text-sm mt-2">{category.description}</p>
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
      </section>
    </div>
  )
}
