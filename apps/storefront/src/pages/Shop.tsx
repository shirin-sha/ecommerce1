export default function Shop() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shop</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-4">Filters</h2>
            <p className="text-gray-600">Filters will be displayed here...</p>
          </div>
        </aside>
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Products will be displayed here...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
