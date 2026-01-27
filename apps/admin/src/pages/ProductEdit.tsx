import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray, Control, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProduct, useCreateProduct, useUpdateProduct } from '../hooks/useProducts'
import { useAttributes, useAttributeTerms } from '../hooks/useAttributes'
import { createProductSchema, CreateProductInput, Product, Variation } from '@ecommerce/shared'
import { Save, Eye, Info, Plus, X, Trash2, Upload, Image as ImageIcon, ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../lib/api'
import {
  useCreateVariation,
  useDeleteVariation,
  useGenerateVariations,
  useUpdateVariation,
  useVariations,
} from '../hooks/useVariations'

// Product Image Upload Component
interface ProductImageUploadProps {
  currentImage?: string
  onImageUploaded: (url: string) => void
  onImageRemoved: () => void
}

function ProductImageUpload({ currentImage, onImageUploaded, onImageRemoved }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)

  useEffect(() => {
    setPreview(currentImage || null)
  }, [currentImage])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/products/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success && response.data.data?.url) {
        // Get full URL - if it's a relative path, prepend API base URL
        let imageUrl = response.data.data.url
        if (imageUrl.startsWith('/')) {
          // Get API base URL (without /api/v1)
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
          const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '')
          // Construct full URL pointing to API server
          imageUrl = baseUrl + imageUrl
        }
        onImageUploaded(imageUrl)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error?.response?.data?.error || 'Failed to upload image')
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
      // Reset file input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onImageRemoved()
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Product preview"
            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-3">No image uploaded</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {preview && (
        <div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Change Image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  )
}

// Product Gallery Upload Component (Multiple Images)
interface ProductGalleryUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
}

function ProductGalleryUpload({ images, onImagesChange }: ProductGalleryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, insertIndex?: number) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const filesArray = Array.from(files)
    
    // Validate all files
    for (const file of filesArray) {
      if (!file.type.startsWith('image/')) {
        alert(`File "${file.name}" is not an image file`)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image "${file.name}" size must be less than 5MB`)
        return
      }
    }

    setUploading(true)
    const uploadedUrls: string[] = []
    let hasError = false

    try {
      // Upload files sequentially
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i]
        setUploadingIndex(i)

        const formData = new FormData()
        formData.append('image', file)

        try {
          const response = await api.post('/products/upload-image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })

          if (response.data.success && response.data.data?.url) {
            let imageUrl = response.data.data.url
            if (imageUrl.startsWith('/')) {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
              const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '')
              imageUrl = baseUrl + imageUrl
            }
            uploadedUrls.push(imageUrl)
          } else {
            throw new Error('Upload failed')
          }
        } catch (error: any) {
          console.error('Upload error:', error)
          alert(`Failed to upload "${file.name}": ${error?.response?.data?.error || 'Upload failed'}`)
          hasError = true
          break
        }
      }

      if (!hasError && uploadedUrls.length > 0) {
        // Insert new images at the specified index or append to the end
        const newImages = [...images]
        if (insertIndex !== undefined && insertIndex >= 0) {
          newImages.splice(insertIndex, 0, ...uploadedUrls)
        } else {
          newImages.push(...uploadedUrls)
        }
        onImagesChange(newImages)
      }
    } finally {
      setUploading(false)
      setUploadingIndex(null)
      // Reset file input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          Add multiple images to create a product gallery.
        </p>
        <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer w-full">
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Add Images'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e)}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-3">No gallery images uploaded</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Images'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e)}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square rounded-lg border border-gray-300 overflow-hidden bg-gray-100">
                <img
                  src={imageUrl}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {uploading && uploadingIndex === index && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-sm">Uploading...</div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-opacity"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleReorder(index, index - 1)}
                      className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-opacity"
                      title="Move left"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleReorder(index, index + 1)}
                      className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-opacity"
                      title="Move right"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500 text-center">Image {index + 1}</div>
            </div>
          ))}
          {/* Add more button */}
          <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Add More</p>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e, images.length)}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  )
}

// Product Attributes Tab Component
interface ProductAttributesTabProps {
  productType: 'simple' | 'variable'
  register: UseFormRegister<CreateProductInput>
  watch: UseFormWatch<CreateProductInput>
  setValue: UseFormSetValue<CreateProductInput>
  control: Control<CreateProductInput>
  product?: Product
  onSave?: () => void
}

function ProductAttributesTab({ productType, register, watch, setValue, control, product, onSave }: ProductAttributesTabProps) {
  const { data: allAttributes } = useAttributes()
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>('')
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({})

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'attributes',
  })

  const currentAttributes = (watch('attributes') as CreateProductInput['attributes']) || []

  const handleAddAttribute = () => {
    if (!selectedAttributeId) return

    const selectedAttribute = allAttributes?.find((attr) => attr._id === selectedAttributeId)
    if (!selectedAttribute) return

    // Check if attribute already added (handle both string and object attributeId)
    const isAlreadyAdded = currentAttributes.some((attr) => {
      const attrId = typeof attr?.attributeId === 'object' && attr?.attributeId !== null
        ? (attr.attributeId as any)._id || String(attr.attributeId)
        : String(attr?.attributeId || '')
      return attrId === selectedAttributeId
    })
    if (isAlreadyAdded) {
      alert('This attribute is already added to the product')
      return
    }

    append({
      attributeId: selectedAttributeId,
      name: selectedAttribute.name,
      values: [],
      usedForVariations: productType === 'variable',
      visibleOnProductPage: true,
      position: currentAttributes.length,
    })

    setSelectedAttributeId('')
  }

  const handleAddValue = (attributeIndex: number, attributeId: string) => {
    const valueInput = newValueInputs[attributeId]?.trim()
    if (!valueInput) return

    const currentValues = currentAttributes[attributeIndex]?.values || []
    if (currentValues.includes(valueInput)) {
      alert('This value already exists')
      return
    }

    const newValues = [...currentValues, valueInput]
    setValue(`attributes.${attributeIndex}.values`, newValues)
    setNewValueInputs({ ...newValueInputs, [attributeId]: '' })
  }

  const handleRemoveValue = (attributeIndex: number, valueIndex: number) => {
    const currentValues = currentAttributes[attributeIndex]?.values || []
    const newValues = currentValues.filter((_, idx) => idx !== valueIndex)
    setValue(`attributes.${attributeIndex}.values`, newValues)
  }

  // Load attribute terms for suggestions
  const AttributeTermsSuggestions = ({ attributeId, currentValues, onAddValue }: { attributeId: string; currentValues: string[]; onAddValue: (value: string) => void }) => {
    const { data: attributeTerms } = useAttributeTerms(attributeId)

    if (!attributeTerms || attributeTerms.length === 0) return null

    const availableTerms = attributeTerms.filter((term) => !currentValues.includes(term.name))

    if (availableTerms.length === 0) return null

    return (
      <div className="mt-3">
        <p className="text-xs text-gray-500 mb-2">Suggested terms from attribute:</p>
        <div className="flex flex-wrap gap-2">
          {availableTerms.map((term) => (
            <button
              key={term._id}
              type="button"
              onClick={() => onAddValue(term.name)}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
            >
              + {term.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Initialize with existing product attributes
  useEffect(() => {
    if (product?.attributes && product.attributes.length > 0 && fields.length === 0) {
      product.attributes.forEach((attr) => {
        // Handle populated attributeId (could be object or string)
        const attributeId = typeof attr.attributeId === 'object' && attr.attributeId !== null
          ? (attr.attributeId as any)._id || String(attr.attributeId)
          : String(attr.attributeId || '')
        
        append({
          attributeId,
          name: attr.name,
          values: attr.values || [],
          usedForVariations: attr.usedForVariations,
          visibleOnProductPage: attr.visibleOnProductPage,
          position: attr.position,
        })
      })
    }
  }, [product, append, fields.length])

  return (
    <div className="space-y-4">
      {productType === 'variable' ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Variable Product:</strong> Attributes are used to create variations. Define attributes like "Size" or
            "Color" here, then create variations in the Variations section.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Simple Product:</strong> Attributes can be used to display additional product information (e.g.,
            Material, Brand) but won't create variations.
          </p>
        </div>
      )}

      {/* Add Attribute Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium mb-3">Add Attribute</h3>
        <div className="flex gap-2">
          <select
            value={selectedAttributeId}
            onChange={(e) => setSelectedAttributeId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an attribute...</option>
            {allAttributes
              ?.filter((attr) => {
                // Check if attribute already added (handle both string and object attributeId)
                return !currentAttributes.some((a) => {
                  const aId = typeof a?.attributeId === 'object' && a?.attributeId !== null
                    ? (a.attributeId as any)._id || String(a.attributeId)
                    : String(a?.attributeId || '')
                  return aId === attr._id
                })
              })
              .map((attr) => (
                <option key={attr._id} value={attr._id}>
                  {attr.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={handleAddAttribute}
            disabled={!selectedAttributeId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        {allAttributes?.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            No attributes available. <a href="/products/attributes" className="text-blue-600 hover:underline">Create attributes first</a>
          </p>
        )}
      </div>

      {/* Attributes List */}
      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No attributes added yet. Add an attribute above to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const attribute = currentAttributes[index]
            const valueInput = newValueInputs[attribute?.attributeId || ''] || ''

            return (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{attribute?.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Attribute ID: {typeof attribute?.attributeId === 'object' && attribute?.attributeId !== null
                        ? (attribute.attributeId as any)._id || String(attribute.attributeId)
                        : String(attribute?.attributeId || '')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remove attribute"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Attribute Options */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`attributes.${index}.usedForVariations`)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Used for variations</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`attributes.${index}.visibleOnProductPage`)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Visible on product page</span>
                    </label>
                  </div>
                </div>

                {/* Values Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Values</label>

                  {/* Add Value Input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={valueInput}
                      onChange={(e) =>
                        setNewValueInputs({ ...newValueInputs, [attribute?.attributeId || '']: e.target.value })
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddValue(index, attribute?.attributeId || '')
                        }
                      }}
                      placeholder="Enter value (e.g., Small, Red, Cotton)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddValue(index, attribute?.attributeId || '')}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-1 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  {/* Values List */}
                  {attribute?.values && attribute.values.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {attribute.values.map((value: any, valueIndex: number) => {
                        // Handle case where value might be an object instead of string
                        const displayValue = typeof value === 'object' && value !== null
                          ? (value.name || value._id || String(value))
                          : String(value || '')
                        return (
                          <span
                            key={valueIndex}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {displayValue}
                            <button
                              type="button"
                              onClick={() => handleRemoveValue(index, valueIndex)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No values added yet. Add values above.</p>
                  )}

                  {/* Suggested Terms from Attribute */}
                  <AttributeTermsSuggestions
                    attributeId={attribute?.attributeId || ''}
                    currentValues={attribute?.values || []}
                    onAddValue={(value) => {
                      const currentValues = attribute?.values || []
                      if (!currentValues.includes(value)) {
                        setValue(`attributes.${index}.values`, [...currentValues, value])
                      }
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* WooCommerce-style save button */}
      {onSave && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save attributes
          </button>
        </div>
      )}
    </div>
  )
}

type VariationFormItem = Variation & {
  manageStock?: boolean
}

function ProductVariationsTab({
  product,
  productId,
  onSaveProduct,
}: {
  product?: Product
  productId: string
  onSaveProduct?: () => void
}) {
  const { data: variations, isLoading } = useVariations(productId)
  const generateVariations = useGenerateVariations()
  const createVariation = useCreateVariation()
  const updateVariation = useUpdateVariation()
  const deleteVariation = useDeleteVariation()

  const variationAttributes =
    product?.attributes?.filter((a) => a.usedForVariations && Array.isArray(a.values) && a.values.length > 0) || []

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { isDirty },
  } = useForm<{ variations: VariationFormItem[] }>({
    defaultValues: { variations: [] },
  })

  const { fields } = useFieldArray({
    control,
    name: 'variations',
  })

  useEffect(() => {
    if (!variations) return
    const normalized: VariationFormItem[] = variations.map((v) => ({
      ...v,
      manageStock: typeof v.stockQty === 'number',
      attributeSelections: (v.attributeSelections || {}) as any,
    }))
    reset({ variations: normalized })

    const initExpanded: Record<string, boolean> = {}
    normalized.slice(0, 2).forEach((v) => {
      initExpanded[v._id] = true
    })
    setExpanded((prev) => ({ ...prev, ...initExpanded }))
  }, [variations, reset])

  const variationsValues = watch('variations') || []

  const handleRegenerate = async () => {
    if (!productId) return
    try {
      await generateVariations.mutateAsync(productId)
    } catch (e: any) {
      alert(e?.response?.data?.details || e?.response?.data?.error || 'Failed to generate variations')
    }
  }

  const handleAddManual = async () => {
    if (!product) return
    if (variationAttributes.length === 0) {
      alert('Add attribute values (and mark them "Used for variations") before creating variations.')
      return
    }
    const attributeSelections: Record<string, string> = {}
    for (const attr of variationAttributes) {
      attributeSelections[attr.name] = attr.values[0]
    }
    await createVariation.mutateAsync({
      productId: product._id,
      variation: {
        attributeSelections,
        regularPrice: product.regularPrice,
        stockStatus: product.stockStatus,
        status: 'active',
      } as any,
    })
  }

  const onSaveVariations = async (values: { variations: VariationFormItem[] }) => {
    try {
      for (const v of values.variations) {
        // Clean up dimensions object - if all fields are undefined, set dimensions to undefined
        let cleanedDimensions = v.dimensions
        if (v.dimensions) {
          const { length, width, height } = v.dimensions
          if (length === undefined && width === undefined && height === undefined) {
            cleanedDimensions = undefined
          } else {
            // Remove undefined fields from dimensions object
            const dims: any = {}
            if (length !== undefined) dims.length = length
            if (width !== undefined) dims.width = width
            if (height !== undefined) dims.height = height
            // Only set dimensions if at least one field has a value
            if (Object.keys(dims).length > 0) {
              cleanedDimensions = dims
            } else {
              cleanedDimensions = undefined
            }
          }
        }

        const patch: Partial<Variation> = {
          sku: v.sku,
          barcode: v.barcode,
          status: v.status,
          regularPrice: v.regularPrice,
          salePrice: v.salePrice,
          saleStart: v.saleStart,
          saleEnd: v.saleEnd,
          stockStatus: v.stockStatus,
          weight: v.weight,
          dimensions: cleanedDimensions,
          shippingClass: v.shippingClass,
          description: v.description,
          attributeSelections: v.attributeSelections,
          stockQty: v.manageStock ? v.stockQty : undefined,
        }
        await updateVariation.mutateAsync({ productId, varId: v._id, patch })
      }
      alert('Variations saved')
    } catch (e: any) {
      alert(e?.response?.data?.details || e?.response?.data?.error || 'Failed to save variations')
    }
  }

  if (!product) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 space-y-3">
        <div>
          <strong>Variations need a saved product.</strong> You’re still on “Add New Product”, so there’s no product ID
          yet.
        </div>
        <div className="text-gray-600">
          Fill <strong>Product Name</strong>, add attributes + values, then save. After that you can click{' '}
          <strong>Regenerate variations</strong>.
        </div>
        {onSaveProduct && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSaveProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save & load variations
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRegenerate}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Regenerate variations
          </button>
          <button
            type="button"
            onClick={handleAddManual}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Add manually
          </button>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>Bulk actions</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-sm text-blue-600">
          <button
            type="button"
            onClick={() => {
              const all = Object.fromEntries((variationsValues || []).map((v) => [v._id, true]))
              setExpanded(all)
            }}
            className="hover:underline"
          >
            Expand
          </button>
          <button type="button" onClick={() => setExpanded({})} className="hover:underline">
            Close
          </button>
        </div>
      </div>

      {variationAttributes.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Add attributes (with values) and tick <strong>Used for variations</strong> in the Attributes tab, then click{' '}
          <strong>Regenerate variations</strong>.
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-600">Loading variations...</div>
      ) : fields.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          No variations yet. Use <strong>Regenerate variations</strong> or <strong>Add manually</strong>.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSaveVariations)} className="space-y-3">
          {fields.map((f, idx) => {
            const v = variationsValues[idx]
            const isOpen = !!expanded[v?._id || f.id]
            const selections = v?.attributeSelections || {}
            const summary =
              Object.keys(selections).length > 0
                ? Object.entries(selections)
                    .map(([k, val]) => `${k}: ${val}`)
                    .join(', ')
                : 'Any...'

            return (
              <div key={f.id} className="border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [v._id]: !isOpen }))}
                    className="text-sm font-medium text-gray-900"
                  >
                    #{v?._id?.slice(-6)} — {summary}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Delete this variation?')) return
                      await deleteVariation.mutateAsync({ productId, varId: v._id })
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                {isOpen && (
                  <div className="p-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {variationAttributes.map((attr) => (
                        <div key={attr.attributeId}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{attr.name}</label>
                          <select
                            value={(v?.attributeSelections as any)?.[attr.name] || ''}
                            onChange={(e) => {
                              const next = { ...(v?.attributeSelections as any), [attr.name]: e.target.value }
                              setValue(`variations.${idx}.attributeSelections` as any, next, { shouldDirty: true })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            {attr.values.map((val) => (
                              <option key={val} value={val}>
                                {val}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-6 items-center">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={(v?.status || 'active') === 'active'}
                          onChange={(e) =>
                            setValue(`variations.${idx}.status` as any, e.target.checked ? 'active' : 'inactive', {
                              shouldDirty: true,
                            })
                          }
                        />
                        Enabled
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" disabled /> Downloadable
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" disabled /> Virtual
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={!!v?.manageStock}
                          onChange={(e) =>
                            setValue(`variations.${idx}.manageStock` as any, e.target.checked, { shouldDirty: true })
                          }
                        />
                        Manage stock?
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                        <input
                          {...register(`variations.${idx}.sku` as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GTIN, UPC, EAN, or ISBN</label>
                        <input
                          {...register(`variations.${idx}.barcode` as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Regular price</label>
                        <input
                          {...register(`variations.${idx}.regularPrice` as any, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sale price</label>
                        <input
                          {...register(`variations.${idx}.salePrice` as any, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock status</label>
                        <select
                          {...register(`variations.${idx}.stockStatus` as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="in_stock">In stock</option>
                          <option value="out_of_stock">Out of stock</option>
                          <option value="backorder">On backorder</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock quantity</label>
                        <input
                          {...register(`variations.${idx}.stockQty` as any, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={!v?.manageStock}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                        <input
                          {...register(`variations.${idx}.weight` as any, {
                            setValueAs: (v) => {
                              if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                              return Number(v)
                            },
                          })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shipping class</label>
                        <input
                          {...register(`variations.${idx}.shippingClass` as any)}
                          placeholder="Same as parent"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</label>
                      <div className="grid grid-cols-3 gap-4">
                        <input
                          {...register(`variations.${idx}.dimensions.length` as any, {
                            setValueAs: (v) => {
                              if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                              return Number(v)
                            },
                          })}
                          placeholder="Length"
                          type="number"
                          step="0.01"
                          min="0"
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          {...register(`variations.${idx}.dimensions.width` as any, {
                            setValueAs: (v) => {
                              if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                              return Number(v)
                            },
                          })}
                          placeholder="Width"
                          type="number"
                          step="0.01"
                          min="0"
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          {...register(`variations.${idx}.dimensions.height` as any, {
                            setValueAs: (v) => {
                              if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                              return Number(v)
                            },
                          })}
                          placeholder="Height"
                          type="number"
                          step="0.01"
                          min="0"
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        {...register(`variations.${idx}.description` as any)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={generateVariations.isPending || updateVariation.isPending}
            >
              Save changes
            </button>
            <div className="text-xs text-gray-500">{isDirty ? 'Unsaved changes' : 'No changes'}</div>
          </div>
        </form>
      )}
    </div>
  )
}

export default function ProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
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
        featuredImage: undefined,
        gallery: [],
        regularPrice: 0,
        soldIndividually: false,
        manageStock: false,
        stockStatus: 'in_stock',
        categoryIds: [],
        tagIds: [],
        attributes: [],
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
      featuredImage: product.featuredImage,
      gallery: product.gallery || [],
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      saleStart: product.saleStart?.toISOString(),
      saleEnd: product.saleEnd?.toISOString(),
      type: product.type,
      sku: product.sku,
      barcode: product.barcode,
      soldIndividually: product.soldIndividually ?? false,
      manageStock: product.manageStock,
      stockQty: product.stockQty,
      stockStatus: product.stockStatus,
      lowStockThreshold: product.lowStockThreshold,
      weight: product.weight,
      dimensions: product.dimensions,
      shippingClass: product.shippingClass,
      categoryIds: product.categoryIds,
      tagIds: product.tagIds,
      attributes: product.attributes || [],
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
    control,
    setValue,
    setFocus,
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

  // Clean up dimensions object in real-time to prevent validation errors
  // If all fields are empty, set dimensions to undefined
  // Otherwise, keep the dimensions object with only the filled fields
  const dimensions = watch('dimensions')
  useEffect(() => {
    if (dimensions) {
      const { length, width, height } = dimensions
      // If all fields are undefined/empty, remove dimensions entirely
      if (length === undefined && width === undefined && height === undefined) {
        setValue('dimensions', undefined, { shouldValidate: false })
      } else {
        // Keep dimensions object but only with defined values
        const cleaned: any = {}
        if (length !== undefined) cleaned.length = length
        if (width !== undefined) cleaned.width = width
        if (height !== undefined) cleaned.height = height
        // Only update if there's a change to avoid infinite loops
        if (Object.keys(cleaned).length > 0) {
          setValue('dimensions', cleaned, { shouldValidate: false })
        }
      }
    }
  }, [dimensions?.length, dimensions?.width, dimensions?.height, setValue])

  const productType = (watch('type') || 'simple') as 'simple' | 'variable'
  type ProductDataTab = 'general' | 'inventory' | 'shipping' | 'linked' | 'attributes' | 'variations' | 'advanced'

  const getDefaultTab = (type: 'simple' | 'variable'): ProductDataTab =>
    type === 'variable' ? 'inventory' : 'general'

  const initialTab = (searchParams.get('tab') as ProductDataTab | null) || getDefaultTab(productType)
  const [activeTab, setActiveTab] = useState<ProductDataTab>(initialTab)

  const setTab = (tab: ProductDataTab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  // Keep the active tab valid when product type changes
  useEffect(() => {
    const validTabs =
      productType === 'variable'
        ? (['inventory', 'shipping', 'linked', 'attributes', 'variations', 'advanced'] as const)
        : (['general', 'inventory', 'shipping', 'attributes', 'advanced'] as const)

    if (!validTabs.includes(activeTab as any)) {
      setTab(getDefaultTab(productType))
    }
  }, [productType, activeTab])

  const onSubmit = async (data: CreateProductInput, opts?: { stay?: boolean; nextTab?: ProductDataTab }) => {
    console.log('onSubmit called with data:', { title: data.title, type: data.type, regularPrice: data.regularPrice })
    try {
      // Clean up dimensions object - if all fields are undefined, set dimensions to undefined
      // Otherwise, keep only the fields that have values
      if (data.dimensions) {
        const { length, width, height } = data.dimensions
        if (length === undefined && width === undefined && height === undefined) {
          data.dimensions = undefined
        } else {
          // Keep only defined fields
          const cleaned: any = {}
          if (length !== undefined && !isNaN(length)) cleaned.length = length
          if (width !== undefined && !isNaN(width)) cleaned.width = width
          if (height !== undefined && !isNaN(height)) cleaned.height = height
          // If no valid fields remain, set to undefined
          if (Object.keys(cleaned).length === 0) {
            data.dimensions = undefined
          } else {
            data.dimensions = cleaned as any
          }
        }
      }

      // Ensure required fields are present
      if (!data.title || data.title.trim() === '') {
        alert('Product name is required')
        setFocus('title')
        return
      }

      if (!data.regularPrice || data.regularPrice <= 0) {
        alert('Regular price must be greater than 0')
        return
      }

      // Log the data being sent for debugging
      console.log('Saving product with data:', {
        isNew,
        title: data.title,
        type: data.type,
        regularPrice: data.regularPrice,
        attributes: data.attributes,
        dimensions: data.dimensions,
      })

      if (isNew) {
        try {
          const result: any = await createProduct.mutateAsync(data)
          console.log('Product created successfully:', result)
          const newId: string | undefined = result?.data?._id || result?.data?.product?._id
          
          if (!newId) {
            console.error('No product ID returned from API:', result)
            alert('Product was created but no ID was returned. Please check the product list.')
            return
          }
          
          if (opts?.stay && newId) {
            const next = opts?.nextTab ? `?tab=${opts.nextTab}` : ''
            navigate(`/products/${newId}/edit${next}`)
            return
          }
          navigate('/products')
        } catch (createError: any) {
          console.error('Error creating product:', createError)
          const errorMessage = createError?.response?.data?.error || 
                              createError?.response?.data?.details || 
                              createError?.message || 
                              'Failed to create product'
          alert(`Failed to create product: ${errorMessage}`)
          throw createError // Re-throw to be caught by outer catch
        }
      } else {
        try {
          await updateProduct.mutateAsync({ id: id!, ...data })
          console.log('Product updated successfully')
          
          if (opts?.stay) {
            if (opts?.nextTab) setTab(opts.nextTab)
            return
          }
          navigate('/products')
        } catch (updateError: any) {
          console.error('Error updating product:', updateError)
          const errorMessage = updateError?.response?.data?.error || 
                              updateError?.response?.data?.details || 
                              updateError?.message || 
                              'Failed to update product'
          alert(`Failed to update product: ${errorMessage}`)
          throw updateError // Re-throw to be caught by outer catch
        }
      }
    } catch (error: any) {
      console.error('Error saving product:', error)
      // Only show alert if it wasn't already shown in the inner catch blocks
      if (!error?.response) {
        const errorMessage = error?.message || 'An unexpected error occurred while saving the product'
        alert(`Error: ${errorMessage}`)
      }
    }
  }

  const onInvalid = (invalidErrors: any) => {
    // Check if title is actually missing
    const titleValue = watch('title')
    const titleError = errors.title || invalidErrors?.title
    
    if (!titleValue || (typeof titleValue === 'string' && titleValue.trim() === '') || titleError) {
      setFocus('title')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      alert('Please enter Product Name before saving.')
      return
    }
    
    // If title is valid but other fields have errors, show those errors
    const errorFields = Object.keys(invalidErrors || errors).filter(key => key !== 'title')
    if (errorFields.length > 0) {
      const errorMessages = errorFields.map(field => {
        const error = invalidErrors?.[field] || errors[field as keyof typeof errors]
        return `${field}: ${error?.message || 'Invalid'}`
      }).join('\n')
      alert(`Please fix the following errors:\n${errorMessages}`)
    } else {
      // Fallback if we can't determine the error
      alert('Please check all required fields before saving.')
    }
  }

  const saveAndStay = (nextTab?: ProductDataTab) => {
    console.log('saveAndStay called with tab:', nextTab)
    handleSubmit(
      (data) => {
        console.log('Form validation passed, calling onSubmit with stay=true')
        onSubmit(data, { stay: true, nextTab })
      },
      (errors) => {
        console.log('Form validation failed:', errors)
        onInvalid(errors)
      }
    )()
  }

  if (!isNew && isLoading) {
    return <div className="p-8">Loading product...</div>
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data), onInvalid)}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{isNew ? 'Add New Product' : 'Edit Product'}</h1>
          <div className="flex gap-2">
            <button 
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              type="submit"
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Product Data</h2>
              {/* Product Type Selector */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Product Type:</label>
              <select
                {...register('type')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="simple">Simple product</option>
                <option value="variable">Variable product</option>
              </select>
              </div>
            </div>

            {/* Product Type Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  {productType === 'simple' ? (
                    <>
                      <strong>Simple product:</strong> A standard physical product with a fixed price. Perfect for items that don't require variations (e.g., a book, a USB cable).
                    </>
                  ) : (
                    <>
                      <strong>Variable product:</strong> A product with variations (e.g., different sizes, colors). You'll set up attributes and variations below. The base price shown is used as a default for variations.
                    </>
              )}
            </div>
              </div>
            </div>

            {/* WooCommerce-style Product Data: left menu + right panel */}
            <div className="flex gap-6">
              {/* Left menu */}
              <div className="w-56 border-r border-gray-200 pr-4">
                <nav className="space-y-1">
                  {productType !== 'variable' && (
                    <button
                      type="button"
                    onClick={() => setTab('general')}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        activeTab === 'general' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      General
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setTab('inventory')}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      activeTab === 'inventory' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Inventory
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab('shipping')}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      activeTab === 'shipping' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Shipping
                  </button>

              {productType === 'variable' && (
                    <button
                      type="button"
                      onClick={() => setTab('linked')}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        activeTab === 'linked' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Linked Products
                      <span className="text-gray-400 text-xs ml-2">(Soon)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setTab('attributes')}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      activeTab === 'attributes' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Attributes
                  </button>

                  {productType === 'variable' && (
                    <button
                      type="button"
                      onClick={() => setTab('variations')}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        activeTab === 'variations' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Variations
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setTab('advanced')}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      activeTab === 'advanced' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Advanced
                  </button>
                </nav>
            </div>

              {/* Right panel */}
              <div className="flex-1">
                {/* General (simple only) */}
                {activeTab === 'general' && productType !== 'variable' && (
                  <div className="space-y-4">
                    <div className="flex gap-6">
                      <div className="flex items-center">
                        <input type="checkbox" id="virtual" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled />
                        <label htmlFor="virtual" className="ml-2 text-sm text-gray-700">
                          Virtual <span className="text-gray-400 text-xs">(Coming soon)</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="downloadable" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled />
                        <label htmlFor="downloadable" className="ml-2 text-sm text-gray-700">
                          Downloadable <span className="text-gray-400 text-xs">(Coming soon)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Pricing</h3>
                      <div className="grid grid-cols-2 gap-4">
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
                    </div>
                  </div>
                )}

            {/* Inventory */}
                {activeTab === 'inventory' && (
                  <div className="space-y-6">
                    {productType === 'variable' && (
                      <p className="text-sm text-gray-500">
                        Settings below apply to all variations without manual stock management enabled.
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                        <input
                          {...register('sku')}
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., PRODUCT-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GTIN, UPC, EAN, or ISBN</label>
                        <input
                          {...register('barcode')}
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 0123456789012"
                        />
                      </div>
                    </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    {...register('manageStock')}
                    type="checkbox"
                    id="manageStock"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="manageStock" className="ml-2 text-sm text-gray-700">
                          Track stock quantity for this product
                  </label>
                </div>

                {watch('manageStock') && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                      <input
                        {...register('stockQty', {
                          setValueAs: (v) => {
                            if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                            return Number(v)
                          },
                        })}
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
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                            <input
                              {...register('lowStockThreshold', {
                                setValueAs: (v) => {
                                  if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                                  return Number(v)
                                },
                              })}
                              type="number"
                              min="0"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        <input
                          {...register('soldIndividually')}
                          type="checkbox"
                          id="soldIndividually"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="soldIndividually" className="ml-2 text-sm text-gray-700">
                          Limit purchases to 1 item per order
                        </label>
              </div>
            </div>
          </div>
                )}

                {/* Shipping */}
                {activeTab === 'shipping' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                      <input
                        {...register('weight', {
                          setValueAs: (v) => {
                            if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                            return Number(v)
                          },
                        })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Length</label>
                          <input
                            {...register('dimensions.length', {
                              setValueAs: (v) => {
                                if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                                return Number(v)
                              },
                            })}
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={product?.dimensions?.length || ''}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Width</label>
                          <input
                            {...register('dimensions.width', {
                              setValueAs: (v) => {
                                if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                                return Number(v)
                              },
                            })}
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={product?.dimensions?.width || ''}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Height</label>
                          <input
                            {...register('dimensions.height', {
                              setValueAs: (v) => {
                                if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                                return Number(v)
                              },
                            })}
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={product?.dimensions?.height || ''}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Class</label>
                      <input
                        {...register('shippingClass')}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Standard, Express"
                      />
                    </div>
                  </div>
                )}

                {/* Linked Products (placeholder) */}
                {activeTab === 'linked' && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                    Linked products (upsells/cross-sells) will be added here.
                  </div>
                )}

                {/* Attributes */}
                {activeTab === 'attributes' && (
                  <ProductAttributesTab
                    productType={productType}
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    control={control}
                    product={product}
                      onSave={() => saveAndStay('attributes')}
                  />
                )}

                {/* Variations (variable only) */}
                {activeTab === 'variations' && productType === 'variable' && (
                  <ProductVariationsTab
                    product={product}
                    productId={product?._id || id || ''}
                    onSaveProduct={() => saveAndStay('variations')}
                  />
                )}

                {/* Advanced */}
                {activeTab === 'advanced' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Note</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional note to send to customers after purchase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Menu Order</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Custom ordering position"
                      />
                    </div>
                  </div>
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

          {/* Product Image */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Product Image</h3>
            <ProductImageUpload
              currentImage={watch('featuredImage')}
              onImageUploaded={(url) => setValue('featuredImage', url, { shouldValidate: true })}
              onImageRemoved={() => setValue('featuredImage', undefined, { shouldValidate: true })}
            />
            {errors.featuredImage && <p className="text-red-600 text-sm mt-1">{errors.featuredImage.message}</p>}
          </div>

          {/* Product Gallery (Multiple Images) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Product Gallery</h3>
            <ProductGalleryUpload
              images={watch('gallery') || []}
              onImagesChange={(images) => setValue('gallery', images, { shouldValidate: true })}
            />
            {errors.gallery && <p className="text-red-600 text-sm mt-1">{errors.gallery.message}</p>}
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

        </div>
      </div>
    </form>
  )
}
