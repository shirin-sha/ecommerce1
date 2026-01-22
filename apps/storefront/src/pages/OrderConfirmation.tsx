import { useParams } from 'react-router-dom'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order Confirmation</h1>
      <p>Order ID: {orderId}</p>
      <p>Order confirmation page coming soon...</p>
    </div>
  )
}
