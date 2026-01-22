export default function ProductDetail() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="bg-gray-200 rounded-lg h-96 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">Product Title</h1>
          <p className="text-2xl font-bold text-blue-600 mb-6">$99.99</p>
          <p className="text-gray-700 mb-6">Product description will be displayed here...</p>
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
