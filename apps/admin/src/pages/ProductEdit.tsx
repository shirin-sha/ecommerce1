import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProduct, useCreateProduct, useUpdateProduct } from '../hooks/useProducts'
import { createProductSchema, CreateProductInput } from '@ecommerce/shared'
import { Save, Eye } from 'lucide-react'
import { useEffect } from 'react'

export default function ProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const { data: product, isLoading } = useProduct(id || '')
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  // Convert Product to CreateProductInput format (Date -> string)
  const getDefaultValues = (): CreateProductInput => {
    if (!product) {
      return {
        title: '',
        status: 'draft',
        visibility: 'visible',
        featured: false,
        type: 'simple',
        regularPrice: 0,
        manageStock: false,
        stockStatus: 'in_stock',
        categoryIds: [],
        tagIds: [],
      }
    }

    return {
      title: product.title,
      slug: product.slug,
      status: product.status,
      visibility: product.visibility,
      featured: product.featured,
      shortDescription: product.shortDescription,
      description: product.description,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      saleStart: product.saleStart?.toISOString(),
      saleEnd: product.saleEnd?.toISOString(),
      type: product.type,
      sku: product.sku,
      barcode: product.barcode,
      manageStock: product.manageStock,
      stockQty: product.stockQty,
      stockStatus: product.stockStatus,
      lowStockThreshold: product.lowStockThreshold,
      weight: product.weight,
      dimensions: product.dimensions,
      shippingClass: product.shippingClass,
      categoryIds: product.categoryIds,
      tagIds: product.tagIds,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: getDefaultValues(),
  })

  // Reset form when product data loads
  useEffect(() => {
    if (product && !isNew) {
      reset(getDefaultValues())
    }
  }, [product, isNew, reset])

  const productType = watch('type')

  const onSubmit = async (data: CreateProductInput) => {
    try {
      if (isNew) {
        await createProduct.mutateAsync(data)
        navigate('/products')
      } else {
        await updateProduct.mutateAsync({ id: id!, ...data })
        navigate('/products')
      }
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  if (!isNew && isLoading) {
    return <div className="p-8">Loading product...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{isNew ? 'Add New Product' : 'Edit Product'}</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => handleSubmit(onSubmit)()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isNew ? 'Publish' : 'Update'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Name */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Product name"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Product Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              {...register('description')}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Product description"
            />
          </div>

          {/* Product Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Product Data</h2>

            {/* Product Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
              <select
                {...register('type')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="simple">Simple product</option>
                <option value="variable">Variable product</option>
              </select>
              {productType === 'variable' && (
                <p className="text-sm text-gray-500 mt-2">Variable products allow you to offer different variations of the same product.</p>
              )}
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Regular Price ($) *</label>
                <input
                  {...register('regularPrice', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.regularPrice && <p className="text-red-600 text-sm mt-1">{errors.regularPrice.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price ($)</label>
                <input
                  {...register('salePrice', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Inventory */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Inventory</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    {...register('manageStock')}
                    type="checkbox"
                    id="manageStock"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="manageStock" className="ml-2 text-sm text-gray-700">
                    Manage stock?
                  </label>
                </div>

                {watch('manageStock') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                      <input
                        {...register('stockQty', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                      <select
                        {...register('stockStatus')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="in_stock">In stock</option>
                        <option value="out_of_stock">Out of stock</option>
                        <option value="backorder">On backorder</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Publish</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                <select
                  {...register('visibility')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="visible">Visible</option>
                  <option value="catalog">Catalog</option>
                  <option value="search">Search</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  {...register('featured')}
                  type="checkbox"
                  id="featured"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                  Featured product
                </label>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Product Categories</h3>
            <p className="text-sm text-gray-500 mb-4">Select categories for this product</p>
            <div className="text-sm text-gray-600">Categories selector will be implemented here</div>
          </div>

          {/* Product Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Product Tags</h3>
            <input
              type="text"
              placeholder="Add tags separated by commas"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">Separate tags with commas</p>
          </div>

          {/* Product Image */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Product Image</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-2">Set product image</p>
              <button className="text-blue-600 hover:text-blue-800 text-sm">Upload Image</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
