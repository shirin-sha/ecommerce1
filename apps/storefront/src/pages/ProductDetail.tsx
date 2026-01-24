import { useParams } from 'react-router-dom'
import { useProduct } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading } = useProduct(slug || '', 'slug')
  const { addToCart } = useCart()

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        productId: product._id,
        name: product.title,
        slug: product.slug,
        price: product.salePrice || product.regularPrice,
        image: product.featuredImage,
        sku: product.sku,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading product...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Product not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="bg-gray-200 rounded-lg h-96 mb-4 overflow-hidden">
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
          {product.gallery && product.gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {product.gallery.map((image: string, index: number) => (
                <div key={index} className="bg-gray-200 rounded-lg h-24 overflow-hidden">
                  <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
          <div className="mb-6">
            {product.salePrice ? (
              <div>
                <span className="text-2xl font-bold text-red-600">${product.salePrice}</span>
                <span className="text-lg text-gray-500 line-through ml-2">${product.regularPrice}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-blue-600">${product.regularPrice}</span>
            )}
          </div>
          {product.shortDescription && (
            <p className="text-gray-700 mb-4 text-lg">{product.shortDescription}</p>
          )}
          {product.description && (
            <div
              className="text-gray-700 mb-6 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
          {product.stockStatus === 'out_of_stock' ? (
            <button
              disabled
              className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed"
            >
              Out of Stock
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add to Cart
            </button>
          )}
          {product.categoryIds && product.categoryIds.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">Categories:</p>
              <div className="flex flex-wrap gap-2">
                {product.categoryIds.map((cat: any) => (
                  <span
                    key={cat._id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
