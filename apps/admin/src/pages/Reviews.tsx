import { useState } from 'react'
import { useReviews, useModerateReview, useDeleteReview } from '../hooks/useReviews'
import { Star, Trash2, Check, X } from 'lucide-react'
import { Review } from '@ecommerce/shared'

export default function Reviews() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useReviews({
    page,
    limit: 20,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: search || undefined,
  })

  const moderateReview = useModerateReview()
  const deleteReview = useDeleteReview()

  const handleApprove = async (id: string) => {
    await moderateReview.mutateAsync({ id, status: 'approved' })
  }

  const handleReject = async (id: string) => {
    await moderateReview.mutateAsync({ id, status: 'spam' })
  }

  const handleTrash = async (id: string) => {
    if (confirm('Are you sure you want to trash this review?')) {
      await deleteReview.mutateAsync(id)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'approved' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('spam')}
              className={`px-4 py-3 border-b-2 font-medium ${
                statusFilter === 'spam' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
              }`}
            >
              Spam
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-md"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading reviews...</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.data?.map((review: Review) => (
                  <tr key={review._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{review.authorName}</div>
                        <div className="text-sm text-gray-500">{review.authorEmail}</div>
                        {review.isVerifiedOwner && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Verified Owner
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-md">
                        {review.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(review.productId as any)?.title || 'Product'}
                    </td>
                    <td className="px-6 py-4">{renderStars(review.rating)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          review.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : review.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {review.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(review._id)}
                              className="text-green-600 hover:text-green-800"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(review._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Mark as Spam"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleTrash(review._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data?.pagination && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">{data.pagination.total} reviews</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-1 text-sm">
                    {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data.pagination.page >= data.pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
