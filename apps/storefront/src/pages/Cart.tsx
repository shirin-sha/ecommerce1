import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getImageUrl } from '../utils/imageUrl'

export default function Cart() {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart()

  const hasItems = items.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            {!hasItems ? (
              <div>
                <p className="text-gray-600">Your cart is empty</p>
                <Link to="/shop" className="text-yellow-700 hover:underline mt-4 inline-block">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variationId || 'base'}`}
                    className="flex items-center gap-4 border-b pb-4 last:border-b-0"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        to={`/products/${item.slug}`}
                        className="font-semibold text-gray-900 hover:text-yellow-700"
                      >
                        {item.name}
                      </Link>
                      {item.sku && (
                        <div className="text-xs text-gray-500 mt-1">SKU: {item.sku}</div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          ${(item.price * item.qty).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          (${item.price.toFixed(2)} × {item.qty})
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center border rounded">
                        <button
                          type="button"
                          className="px-2 py-1 text-gray-700 hover:bg-gray-100"
                          onClick={() =>
                            updateQuantity(item.productId, item.variationId, item.qty - 1)
                          }
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-sm">{item.qty}</span>
                        <button
                          type="button"
                          className="px-2 py-1 text-gray-700 hover:bg-gray-100"
                          onClick={() =>
                            updateQuantity(item.productId, item.variationId, item.qty + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.variationId)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Clear cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>$0.00</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              className="w-full bg-yellow-500 text-gray-900 py-3 rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasItems}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
