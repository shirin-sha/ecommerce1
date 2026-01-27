import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProduct } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading } = useProduct(slug || '', 'slug')
  const { addToCart } = useCart()
  
  // Helper function to get full image URL
  const getImageUrl = (imagePath?: string): string | undefined => {
    if (!imagePath) return undefined
    // If it's already a full URL (http/https), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    // If it's a relative path, prepend API base URL
    if (imagePath.startsWith('/')) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
      const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '')
      return baseUrl + imagePath
    }
    return imagePath
  }

  // Get all images: featured image + gallery images
  const allImages = product 
    ? [
        product.featuredImage && getImageUrl(product.featuredImage),
        ...(product.gallery || []).map(img => getImageUrl(img))
      ].filter(Boolean) as string[]
    : []
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

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

  const currentImage = allImages[selectedImageIndex] || getImageUrl(product?.featuredImage)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          {/* Main Image */}
          <div className="bg-gray-200 rounded-lg h-96 mb-4 overflow-hidden relative group">
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {allImages.map((image: string, index: number) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`bg-gray-200 rounded-lg h-24 overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-blue-600 ring-2 ring-blue-300'
                      : 'border-transparent hover:border-gray-400'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* Single image indicator */}
          {allImages.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-4">
              No images available
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
