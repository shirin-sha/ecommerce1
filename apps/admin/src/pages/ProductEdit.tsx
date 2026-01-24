import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray, Control, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProduct, useCreateProduct, useUpdateProduct } from '../hooks/useProducts'
import { useAttributes, useAttributeTerms } from '../hooks/useAttributes'
import { createProductSchema, CreateProductInput, Product, Variation } from '@ecommerce/shared'
import { Save, Eye, Info, Plus, X, Trash2 } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import {
  useCreateVariation,
  useDeleteVariation,
  useGenerateVariations,
  useUpdateVariation,
  useVariations,
} from '../hooks/useVariations'
import axios from 'axios'

// Create a separate axios instance for file uploads (without default Content-Type)
// Use the same baseURL logic as the main api instance
const getUploadApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) {
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`
  }
  return typeof window !== 'undefined' ? window.location.origin + '/api/v1' : '/api/v1'
}

const uploadApi = axios.create({
  baseURL: getUploadApiUrl(),
  withCredentials: true,
  // Don't set Content-Type - let axios set it automatically for FormData
})
uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Ensure FormData is not transformed
  if (config.data instanceof FormData) {
    // Don't set Content-Type - axios will set it with boundary
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  }
  return config
})

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null)
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])

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
      // Reset file states when loading existing product
      setFeaturedImageFile(null)
      setFeaturedImagePreview(null)
      setGalleryFiles([])
      setGalleryPreviews([])
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

      // Upload featured image if a new file was selected
      if (featuredImageFile && featuredImageFile instanceof File) {
        try {
          const form = new FormData()
          form.append('file', featuredImageFile)
          console.log('Uploading featured image:', featuredImageFile.name, featuredImageFile.size, featuredImageFile.type)
          const { data: uploadData } = await uploadApi.post('/uploads/image', form)
          console.log('Upload successful:', uploadData)
          data.featuredImage = uploadData.data.url
        } catch (err: any) {
          console.error('Image upload error:', err)
          console.error('Error response:', err?.response?.data)
          alert(`Failed to upload featured image: ${err?.response?.data?.error || err?.message || 'Upload failed'}`)
          return
        }
      }

      // Upload gallery images if new files were selected
      if (galleryFiles.length > 0) {
        const uploadedGalleryUrls: string[] = []
        try {
          for (const file of galleryFiles) {
            const form = new FormData()
            form.append('file', file)
            const { data: uploadData } = await uploadApi.post('/uploads/image', form)
            uploadedGalleryUrls.push(uploadData.data.url)
          }
          // Merge with existing gallery URLs
          data.gallery = [...(data.gallery || []), ...uploadedGalleryUrls]
        } catch (err: any) {
          alert(`Failed to upload gallery images: ${err?.response?.data?.error || err?.message || 'Upload failed'}`)
          return
        }
      }

      if (isNew) {
        const result: any = await createProduct.mutateAsync(data)
        const newId: string | undefined = result?.data?._id
        // Clear file states after successful save
        setFeaturedImageFile(null)
        setFeaturedImagePreview(null)
        setGalleryFiles([])
        setGalleryPreviews([])
        if (opts?.stay && newId) {
          const next = opts?.nextTab ? `?tab=${opts.nextTab}` : ''
          navigate(`/products/${newId}/edit${next}`)
          return
        }
        navigate('/products')
      } else {
        await updateProduct.mutateAsync({ id: id!, ...data })
        // Clear file states after successful save
        setFeaturedImageFile(null)
        setFeaturedImagePreview(null)
        setGalleryFiles([])
        setGalleryPreviews([])
        if (opts?.stay) {
          if (opts?.nextTab) setTab(opts.nextTab)
          return
        }
        navigate('/products')
      }
    } catch (error) {
      console.error('Error saving product:', error)
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

  const saveAndExit = () => handleSubmit((data) => onSubmit(data), onInvalid)()
  const saveAndStay = (nextTab?: ProductDataTab) =>
    handleSubmit((data) => onSubmit(data, { stay: true, nextTab }), onInvalid)()

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
            onClick={saveAndExit}
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
            <div className="space-y-3">
              {featuredImagePreview || watch('featuredImage') ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={featuredImagePreview || watch('featuredImage')}
                    alt="Product"
                    className="w-full h-48 object-cover"
                  />
                </div>
              ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-2">Set product image</p>
            </div>
              )}

              <input
                ref={fileInputRef}
                id="featuredImageFile"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  
                  // Validate file size (5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    alert('File size must be less than 5MB')
                    e.target.value = ''
                    return
                  }
                  
                  // Validate file type
                  if (!file.type.startsWith('image/')) {
                    alert('Please select an image file (JPG, PNG, or WebP)')
                    e.target.value = ''
                    return
                  }
                  
                  // Create preview URL
                  const previewUrl = URL.createObjectURL(file)
                  setFeaturedImageFile(file)
                  setFeaturedImagePreview(previewUrl)
                  // Clear the existing URL from form (will be set after upload on save)
                  setValue('featuredImage' as any, undefined, { shouldDirty: true })
                  e.target.value = ''
                }}
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Image
                </button>
                {(featuredImagePreview || watch('featuredImage')) && (
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800 text-sm"
                    onClick={() => {
                      if (featuredImagePreview) {
                        URL.revokeObjectURL(featuredImagePreview)
                        setFeaturedImagePreview(null)
                      }
                      setFeaturedImageFile(null)
                      setValue('featuredImage' as any, undefined, { shouldDirty: true })
                    }}
                  >
                    Remove
                  </button>
                )}
          </div>
              <p className="text-xs text-gray-500">Max 5MB. JPG/PNG/WebP supported.</p>
            </div>
          </div>

          {/* Product Gallery */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Product Gallery</h3>
            <div className="space-y-3">
              {(watch('gallery') && (watch('gallery') as string[]).length > 0) || galleryPreviews.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {/* Show existing gallery images */}
                  {(watch('gallery') as string[] || []).map((imageUrl, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-32 object-cover border border-gray-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const currentGallery = (watch('gallery') as string[]) || []
                          const newGallery = currentGallery.filter((_, i) => i !== index)
                          setValue('gallery' as any, newGallery, { shouldDirty: true })
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {/* Show preview images from selected files */}
                  {galleryPreviews.map((previewUrl, index) => (
                    <div key={`preview-${index}`} className="relative group">
                      <img
                        src={previewUrl}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover border border-gray-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(previewUrl)
                          const newPreviews = galleryPreviews.filter((_, i) => i !== index)
                          const newFiles = galleryFiles.filter((_, i) => i !== index)
                          setGalleryPreviews(newPreviews)
                          setGalleryFiles(newFiles)
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500 mb-2">No gallery images</p>
                  <p className="text-sm text-gray-400">Add images to show in product gallery</p>
                </div>
              )}

              <input
                ref={galleryInputRef}
                id="galleryImageFile"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files
                  if (!files || files.length === 0) return

                  const newFiles: File[] = []
                  const newPreviews: string[] = []

                  // Validate and create previews for each file
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    
                    // Validate file size (5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      alert(`File "${file.name}" is too large. Max 5MB per image.`)
                      continue
                    }
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      alert(`File "${file.name}" is not an image file.`)
                      continue
                    }
                    
                    newFiles.push(file)
                    newPreviews.push(URL.createObjectURL(file))
                  }

                  if (newFiles.length > 0) {
                    setGalleryFiles([...galleryFiles, ...newFiles])
                    setGalleryPreviews([...galleryPreviews, ...newPreviews])
                  }
                  
                  e.target.value = ''
                }}
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Add Gallery Images
                </button>
                {((watch('gallery') && (watch('gallery') as string[]).length > 0) || galleryPreviews.length > 0) && (
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800 text-sm"
                    onClick={() => {
                      if (confirm('Remove all gallery images?')) {
                        // Clear existing gallery
                        setValue('gallery' as any, [], { shouldDirty: true })
                        // Clear preview URLs
                        galleryPreviews.forEach((url) => URL.revokeObjectURL(url))
                        setGalleryPreviews([])
                        setGalleryFiles([])
                      }
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">Max 5MB per image. JPG/PNG/WebP supported. You can select multiple images at once.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
