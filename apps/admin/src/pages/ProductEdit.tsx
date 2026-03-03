import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray, Control, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'

import { useQueryClient } from '@tanstack/react-query'
import { useProduct } from '../hooks/useProducts'
import { useAttributes, useAttributeTerms, useCreateAttributeTerm } from '../hooks/useAttributes'
import { useCategories, useCreateCategory } from '../hooks/useCategories'
import { useTags } from '../hooks/useTags'
import { Product, Variation, Category, Tag } from '@ecommerce/shared'
import { Save, Eye, Info, Plus, X, Trash2, Upload, Image as ImageIcon, ArrowLeft, ArrowRight, ChevronRight, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../lib/api'
import { getImageUrl } from '../utils/imageUrl'
// Variation hooks are currently not used – variations are managed locally in the form

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
        // Store the URL exactly as returned by the API (relative or absolute).
        const imageUrl = response.data.data.url
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
            src={getImageUrl(preview)}
            alt="Product preview"
            loading="lazy"
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
            const imageUrl = response.data.data.url
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
                  src={getImageUrl(imageUrl)}
                  alt={`Gallery image ${index + 1}`}
                  loading="lazy"
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

// Category Tree Selector Component
interface CategoryTreeSelectorProps {
  selectedCategoryIds: string[]
  onSelectionChange: (categoryIds: string[]) => void
}

function CategoryTreeSelector({ selectedCategoryIds, onSelectionChange }: CategoryTreeSelectorProps) {
  const { data: allCategories } = useCategories()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Auto-expand categories that have selected children
  useEffect(() => {
    if (!allCategories || selectedCategoryIds.length === 0) return

    const newExpanded = new Set<string>()
    
    // Find all ancestors of selected categories
    const findAncestors = (categoryId: string): string[] => {
      const ancestors: string[] = []
      const category = allCategories.find(c => c._id === categoryId)
      if (!category || !category.parentId) return ancestors
      
      const parentId = typeof category.parentId === 'string' 
        ? category.parentId 
        : (category.parentId as any)?._id || String(category.parentId)
      
      ancestors.push(parentId)
      ancestors.push(...findAncestors(parentId))
      return ancestors
    }

    selectedCategoryIds.forEach(catId => {
      const ancestors = findAncestors(catId)
      ancestors.forEach(ancestorId => newExpanded.add(ancestorId))
    })

    setExpandedCategories(prev => {
      const combined = new Set([...prev, ...newExpanded])
      return combined
    })
  }, [allCategories, selectedCategoryIds])

  // Build category tree structure
  const buildCategoryTree = (categories: Category[] = []): (Category & { children?: Category[] })[] => {
    const categoryMap = new Map<string, Category & { children?: Category[] }>()
    const rootCategories: (Category & { children?: Category[] })[] = []

    // Helper to get parentId as string
    const getParentId = (cat: Category): string | null => {
      if (!cat.parentId) return null
      if (typeof cat.parentId === 'string') return cat.parentId
      if (typeof cat.parentId === 'object' && cat.parentId !== null) {
        return (cat.parentId as any)._id || String(cat.parentId)
      }
      return String(cat.parentId)
    }

    // First pass: create map of all categories
    categories.forEach(cat => {
      categoryMap.set(cat._id, { ...cat, children: [] })
    })

    // Second pass: build tree
    categories.forEach(cat => {
      const category = categoryMap.get(cat._id)!
      const parentId = getParentId(cat)
      
      if (parentId) {
        const parent = categoryMap.get(parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(category)
        } else {
          // Parent not found in list, treat as root
          rootCategories.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }

  // Find matching categories for search highlighting
  const matchingCategoryIds = searchQuery
    ? new Set(
        (allCategories || [])
          .filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(cat => cat._id)
      )
    : new Set<string>()

  // When searching, expand all categories to show matches
  useEffect(() => {
    if (searchQuery && matchingCategoryIds.size > 0 && allCategories) {
      const allIds = new Set<string>(matchingCategoryIds)
      const categories = allCategories // Store in local variable for TypeScript
      // Also expand parents of matching categories
      categories.forEach(cat => {
        if (matchingCategoryIds.has(cat._id) && cat.parentId) {
          const parentId = typeof cat.parentId === 'string' 
            ? cat.parentId 
            : (cat.parentId as any)?._id || String(cat.parentId)
          allIds.add(parentId)
          // Expand all ancestors
          let current = categories.find(c => c._id === parentId)
          while (current?.parentId) {
            const grandParentId = typeof current.parentId === 'string'
              ? current.parentId
              : (current.parentId as any)?._id || String(current.parentId)
            allIds.add(grandParentId)
            current = categories.find(c => c._id === grandParentId)
          }
        }
      })
      setExpandedCategories(allIds)
    }
  }, [searchQuery, matchingCategoryIds, allCategories])

  const categoryTree = buildCategoryTree(allCategories || [])

  const toggleCategory = (categoryId: string) => {
    const newSelection = [...selectedCategoryIds]
    const index = newSelection.indexOf(categoryId)
    
    if (index > -1) {
      newSelection.splice(index, 1)
    } else {
      newSelection.push(categoryId)
    }
    
    onSelectionChange(newSelection)
  }

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategoryNode = (category: Category & { children?: Category[] }, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category._id)
    const isSelected = selectedCategoryIds.includes(category._id)
    const isMatchingSearch = searchQuery && matchingCategoryIds.has(category._id)

    return (
      <div key={category._id} className="select-none">
        <div 
          className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(category._id)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <span className="w-5" /> // Spacer for alignment
          )}
          
          <label className="flex items-center gap-2 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleCategory(category._id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className={`text-sm ${isMatchingSearch ? 'font-semibold text-blue-700 bg-yellow-100 px-1 rounded' : 'text-gray-700'}`}>
              {category.name}
            </span>
            {category.count !== undefined && category.count > 0 && (
              <span className="text-xs text-gray-500">({category.count})</span>
            )}
          </label>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search Box */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Category Tree */}
      <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto bg-white">
        {categoryTree.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No categories available. <a href="/categories" className="text-blue-600 hover:underline">Create categories first</a>
          </div>
        ) : matchingCategoryIds.size === 0 && searchQuery ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No categories found matching "{searchQuery}"
          </div>
        ) : (
          <div className="p-2">
            {categoryTree.map(category => renderCategoryNode(category))}
          </div>
        )}
      </div>
      
      {selectedCategoryIds.length > 0 && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">
            <strong>{selectedCategoryIds.length}</strong> categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCategoryIds.map(catId => {
              const cat = allCategories?.find(c => c._id === catId)
              return cat ? (
                <span
                  key={catId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => toggleCategory(catId)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Tag Selector Component
interface TagSelectorProps {
  selectedTags: string[]
  onSelectionChange: (tags: string[]) => void
}

function TagSelector({ selectedTags, onSelectionChange }: TagSelectorProps) {
  const [inputValue, setInputValue] = useState('')
  const { data: allTags, isLoading } = useTags()
  const [localTags, setLocalTags] = useState<Tag[]>([])

  const handleToggleTag = (tagName: string) => {
    const lower = tagName.toLowerCase()
    const newSelection = [...selectedTags]
    const index = newSelection.findIndex((t) => t.toLowerCase() === lower)

    if (index > -1) {
      newSelection.splice(index, 1)
    } else {
      newSelection.push(tagName)
    }

    onSelectionChange(newSelection)
  }

  const combinedTags = [...(allTags || []), ...localTags]

  const handleAddFromInput = () => {
    const value = inputValue.trim()
    if (!value) return

    // Split by commas, trim each, drop empties
    const names = value
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0)

    if (names.length === 0) return

    const nextSelected = [...selectedTags]
    const nextLocalTags = [...localTags]

    for (const name of names) {
      const existingTag = combinedTags.find((t) => t.name.toLowerCase() === name.toLowerCase())
      if (existingTag) {
        if (!nextSelected.some((n) => n.toLowerCase() === existingTag.name.toLowerCase())) {
          nextSelected.push(existingTag.name)
        }
        continue
      }

      const newTag: Tag = {
        _id: `temp-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name,
        slug: '',
        description: '',
        count: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      nextLocalTags.push(newTag)
      nextSelected.push(newTag.name)
    }

    setLocalTags(nextLocalTags)
    onSelectionChange(nextSelected)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddFromInput()
    }
  }

  // Sort tags by count desc to mimic “most used” cloud
  const sortedTags =
    combinedTags.slice().sort((a, b) => {
      const ac = a.count ?? 0
      const bc = b.count ?? 0
      return bc - ac
    }) || []

  return (
    <div className="space-y-3">
      {/* Input like WooCommerce: "Separate tags with commas" */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Separate tags with commas"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="button"
          onClick={handleAddFromInput}
          disabled={!inputValue.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
        >
          Add
        </button>
      </div>

      {/* Selected tags like chips with remove icon */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tagName) => {
            const tag =
              combinedTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase()) ||
              ({ name: tagName } as Partial<Tag>)
            return tag && tag.name ? (
              <span
                key={tagName}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleToggleTag(tag.name!)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null
          })}
        </div>
      )}

      {/* Most used tags cloud */}
      <div className="mt-2">
        <p className="text-xs text-gray-600 mb-2">Choose from the most used tags</p>
        {isLoading ? (
          <div className="text-xs text-gray-500">Loading tags...</div>
        ) : sortedTags.length === 0 ? (
          <div className="text-xs text-gray-500">
            No tags available. Create some tags first.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedTags.map((tag) => {
              const isSelected = selectedTags.some(
                (n) => n.toLowerCase() === tag.name.toLowerCase()
              )
              return (
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => handleToggleTag(tag.name)}
                  className={`text-xs underline ${
                    isSelected ? 'text-blue-700 font-semibold' : 'text-blue-600'
                  }`}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Product Attributes Tab Component
interface ProductAttributesTabProps {
  productType: 'simple' | 'variable'
  register: UseFormRegister<any>
  watch: UseFormWatch<any>
  setValue: UseFormSetValue<any>
  control: Control<any>
  product?: Product
  onSave?: () => void
}

function ProductAttributesTab({
  productType,
  register,
  watch,
  setValue,
  control,
  product,
  onSave,
}: ProductAttributesTabProps) {
  const { data: allAttributes } = useAttributes()
  const createAttributeTerm = useCreateAttributeTerm()
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>('')
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({})

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'attributes',
  })

  const currentAttributes = (watch('attributes') as any[]) || []

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

  const handleAddValue = async (attributeIndex: number, attributeId: string) => {
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

    // Also create a persistent term for this attribute so it can be reused later
    if (attributeId) {
      try {
        await createAttributeTerm.mutateAsync({
          attributeId,
          term: { name: valueInput },
        })
      } catch (error) {
        console.error('Failed to create attribute term from value input', error)
      }
    }
  }

  // Attribute terms selector - Woo-style value chips with Select all / Select none / Create value
  const AttributeTermsSelector = ({
    attributeId,
    attributeIndex,
  }: {
    attributeId: string
    attributeIndex: number
  }) => {
    const { data: attributeTerms } = useAttributeTerms(attributeId)
    const currentValues: string[] = (watch(`attributes.${attributeIndex}.values` as any) as any[]) || []

    const handleSelectAll = () => {
      if (!attributeTerms) return
      const allNames = attributeTerms.map((t) => t.name)
      setValue(`attributes.${attributeIndex}.values` as any, allNames as any)
    }

    const handleSelectNone = () => {
      setValue(`attributes.${attributeIndex}.values` as any, [] as any)
    }

    const toggleValue = (name: string) => {
      const exists = currentValues.includes(name)
      const next = exists ? currentValues.filter((v) => v !== name) : [...currentValues, name]
      setValue(`attributes.${attributeIndex}.values` as any, next as any)
    }

    // Merge terms from API with any ad-hoc values so new values also show as chips immediately
    const valueNames = new Set<string>()
    if (attributeTerms) {
      attributeTerms.forEach((t) => valueNames.add(t.name))
    }
    currentValues.forEach((v) => valueNames.add(v))
    const allValueNames = Array.from(valueNames)

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 border border-gray-300 rounded-lg px-3 py-2 min-h-[42px]">
          {allValueNames.length === 0 && (
            <span className="text-xs text-gray-500">No values defined yet.</span>
          )}
          {allValueNames.map((name) => {
            const selected = currentValues.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleValue(name)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${
                  selected
                    ? 'bg-gray-200 text-gray-800 border-gray-400'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">×</span>
                {name}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs mt-1">
          <button
            type="button"
            className="px-2 py-1 border border-gray-300 rounded bg-gray-50 hover:bg-gray-100"
            onClick={handleSelectAll}
          >
            Select all
          </button>
          <button
            type="button"
            className="px-2 py-1 border border-gray-300 rounded bg-gray-50 hover:bg-gray-100"
            onClick={handleSelectNone}
          >
            Select none
          </button>
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => handleAddValue(attributeIndex, attributeId)}
          >
            Create value
          </button>
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
        <h3 className="font-medium mb-3">Add attribute</h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-700 font-medium">Add existing:</span>
          <select
            value={selectedAttributeId}
            onChange={(e) => setSelectedAttributeId(e.target.value)}
            className="flex-1 min-w-[220px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <span className="text-sm text-gray-500 mx-1">or</span>

          <button
            type="button"
            onClick={() =>
              append({
                attributeId: '',
                name: '',
                values: [],
                usedForVariations: productType === 'variable',
                visibleOnProductPage: true,
                position: currentAttributes.length,
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Add new
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
          const valueKey = (attribute?.attributeId as string) || field.id
          const valueInput = newValueInputs[valueKey] || ''

            return (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {attribute?.attributeId ? (
                      <>
                        <h4 className="font-medium text-gray-900">{attribute?.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Attribute: existing global attribute
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-medium text-gray-900">New attribute</h4>
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            {...register(`attributes.${index}.name` as any)}
                            placeholder="e.g., size or color"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </>
                    )}
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

                {/* Options + Values Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`attributes.${index}.visibleOnProductPage` as any)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Visible on the product page</span>
                    </label>
                    {productType === 'variable' && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register(`attributes.${index}.usedForVariations` as any)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Used for variations</span>
                      </label>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="block text-sm font-medium text-gray-700">Value(s)</span>
                      {attribute?.attributeId && (
                        <span className="text-xs text-gray-500">
                          Select from existing terms or create a new value.
                        </span>
                      )}
                    </div>

                    {attribute?.attributeId ? (
                      <>
                        {/* Existing attribute: show Woo-style selector tied to terms */}
                        <AttributeTermsSelector attributeId={attribute.attributeId} attributeIndex={index} />

                        {/* Hidden input bound to form values for submission */}
                        <input
                          type="hidden"
                          {...register(`attributes.${index}.values` as any)}
                        />

                        {/* Inline new value input used when clicking "Create value" */}
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={valueInput}
                            onChange={(e) =>
                              setNewValueInputs({ ...newValueInputs, [valueKey]: e.target.value })
                            }
                            placeholder="New value name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddValue(index, attribute.attributeId)}
                            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            Add value
                          </button>
                        </div>
                      </>
                    ) : (
                      // Fallback: free-form values if attributeId is missing
                      <div>
                        <textarea
                          value={(attribute?.values || []).join(' | ')}
                          onChange={(e) => {
                            const parts = e.target.value
                              .split('|')
                              .map((p) => p.trim())
                              .filter(Boolean)
                            setValue(`attributes.${index}.values`, parts as any)
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Enter some descriptive text. Use “|” to separate different values."
                        />
                      </div>
                    )}
                  </div>
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
  attributesForVariations,
}: {
  product?: Product
  productId: string
  onSaveProduct?: () => void
  attributesForVariations: any[]
}) {
  // Mark currently unused props as used to satisfy TypeScript's noUnusedLocals
  void productId
  void onSaveProduct
  const variationAttributes =
    attributesForVariations?.filter(
      (a) => a.usedForVariations && Array.isArray(a.values) && a.values.length > 0
    ) || []

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showBulkPrice, setShowBulkPrice] = useState(false)
  const [bulkPrice, setBulkPrice] = useState<string>('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
  } = useForm<{ variations: VariationFormItem[] }>({
    defaultValues: { variations: [] },
  })

  const { fields } = useFieldArray({
    control,
    name: 'variations',
  })

  const variationsValues = watch('variations') || []

  const handleApplyBulkPrice = () => {
    if (!variationsValues.length) {
      alert('There are no variations to update.')
      return
    }

    const value = parseFloat(bulkPrice)
    if (isNaN(value) || value < 0) {
      alert('Please enter a valid price.')
      return
    }

    variationsValues.forEach((_, idx) => {
      setValue(`variations.${idx}.regularPrice` as any, value, { shouldDirty: true })
    })

    setShowBulkPrice(false)
  }

  const handleRegenerate = () => {
    if (variationAttributes.length === 0) {
      alert('Add attribute values (and mark them "Used for variations") before generating variations.')
      return
    }

    // Build all combinations of attribute values (cartesian product)
    const sources = variationAttributes.map((attr) => ({
      name: attr.name,
      values: (attr.values || []) as string[],
    }))

    const combos: Record<string, string>[] = []

    const build = (index: number, current: Record<string, string>) => {
      if (index === sources.length) {
        combos.push({ ...current })
        return
      }
      const src = sources[index]
      if (!src.values.length) {
        build(index + 1, current)
        return
      }
      src.values.forEach((val: string) => {
        current[src.name] = val
        build(index + 1, current)
      })
    }

    build(0, {})

    const generated: VariationFormItem[] = combos.map((combo, idx) => ({
      _id: `temp-${Date.now()}-${idx}`,
      attributeSelections: combo as any,
      status: 'active',
      regularPrice: product?.regularPrice,
      stockStatus: product?.stockStatus || 'in_stock',
      manageStock: false,
    })) as any

    reset({ variations: generated })

    const initExpanded: Record<string, boolean> = {}
    generated.slice(0, 2).forEach((v) => {
      initExpanded[v._id] = true
    })
    setExpanded(initExpanded)
  }

  const handleAddManual = () => {
    if (variationAttributes.length === 0) {
      alert('Add attribute values (and mark them "Used for variations") before creating variations.')
      return
    }

    const attributeSelections: Record<string, string> = {}
    for (const attr of variationAttributes) {
      const firstValue = (attr.values || [])[0]
      if (firstValue) {
        attributeSelections[attr.name] = firstValue
      }
    }

    const current = variationsValues || []
    const newVar: VariationFormItem = {
      _id: `temp-${Date.now()}-${current.length}`,
      attributeSelections: attributeSelections as any,
      status: 'active',
      regularPrice: product?.regularPrice,
      stockStatus: product?.stockStatus || 'in_stock',
      manageStock: false,
    } as any

    const next = [...current, newVar]
    reset({ variations: next })
    setExpanded((prev) => ({ ...prev, [newVar._id]: true }))
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

        // Clean up optional numeric fields - convert NaN to undefined
        // This happens when valueAsNumber: true is used with empty inputs
        const cleanedSalePrice = v.salePrice !== undefined && !isNaN(v.salePrice) ? v.salePrice : undefined
        const cleanedWeight = v.weight !== undefined && !isNaN(v.weight) ? v.weight : undefined
        const cleanedStockQty = v.stockQty !== undefined && !isNaN(v.stockQty) ? v.stockQty : undefined

        // For now, just normalize values locally; variation save API is disabled.
        const normalized: Partial<Variation> = {
          sku: v.sku,
          barcode: v.barcode,
          image: v.image,
          status: v.status,
          regularPrice: v.regularPrice,
          salePrice: cleanedSalePrice,
          saleStart: v.saleStart,
          saleEnd: v.saleEnd,
          stockStatus: v.stockStatus,
          weight: cleanedWeight,
          dimensions: cleanedDimensions,
          shippingClass: v.shippingClass,
          description: v.description,
          attributeSelections: v.attributeSelections,
          stockQty: v.manageStock ? cleanedStockQty : undefined,
        }

        // Update local form state
        setValue(`variations.${values.variations.indexOf(v)}` as any, {
          ...v,
          ...normalized,
        } as any)
      }
      alert('Variations saved in the form. API calls are disabled for now.')
    } catch (e: any) {
      console.error('Error normalizing variations', e)
      alert('Failed to save variations in the form.')
    }
  }

  // Check for variations without prices
  const variationsWithoutPrice = variationsValues.filter(
    (v) => !v.regularPrice || v.regularPrice <= 0
  ).length

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Default Form Values:</label>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option>No default</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowBulkPrice((prev) => !prev)}
            className="text-sm text-blue-600 hover:underline"
          >
            Add price to all variations
          </button>
        </div>

        {showBulkPrice && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Enter price"
            />
            <button
              type="button"
              onClick={handleApplyBulkPrice}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setShowBulkPrice(false)
                setBulkPrice('')
              }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Regenerate variations
            </button>
            <button
              type="button"
              onClick={handleAddManual}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Add manually
            </button>
            <div className="relative">
              <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm appearance-none pr-8">
                <option>Bulk actions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Warning about variations without prices */}
        {variationsWithoutPrice > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              {variationsWithoutPrice} variation{variationsWithoutPrice > 1 ? 's' : ''} do{variationsWithoutPrice > 1 ? '' : 'es'} not have a price. Variations (and their attributes) that do not have prices will not be shown in your store.
            </p>
          </div>
        )}
      </div>

      {variationAttributes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">
              Add some attributes in the Attributes tab to generate variations. Make sure to check the{' '}
              <strong>Used for variations</strong> box.{' '}
              <a href="#" className="text-blue-600 hover:underline" onClick={(e) => e.preventDefault()}>
                Learn more
              </a>
              .
            </p>
          </div>
        </div>
      ) : fields.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">
              Add some attributes in the Attributes tab to generate variations. Make sure to check the{' '}
              <strong>Used for variations</strong> box.{' '}
              <a href="#" className="text-blue-600 hover:underline" onClick={(e) => e.preventDefault()}>
                Learn more
              </a>
              .
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSaveVariations)} className="space-y-3">
          {/* Variation Selector */}
          {fields.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    onChange={(e) => {
                      const selectedId = e.target.value
                      if (selectedId) {
                        setExpanded({ [selectedId]: true })
                        const element = document.getElementById(`variation-${selectedId}`)
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }}
                  >
                    <option value="">Select variation...</option>
                    {variationsValues.map((v) => {
                      const selections = v?.attributeSelections || {}
                      const summary =
                        Object.keys(selections).length > 0
                          ? Object.entries(selections)
                              .map(([k, val]) => `${k}: ${val}`)
                              .join(', ')
                          : 'Any...'
                      return (
                        <option key={v._id} value={v._id}>
                          #{v?._id?.slice(-6)} — {summary}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <button
                    type="button"
                    onClick={() => {
                      const all = Object.fromEntries((variationsValues || []).map((v) => [v._id, true]))
                      setExpanded(all)
                    }}
                    className="hover:underline"
                  >
                    Expand / Close
                  </button>
                </div>
              </div>
            </div>
          )}

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
              <div key={f.id} id={`variation-${v._id}`} className="bg-white border border-gray-200 rounded-lg shadow">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [v._id]: !isOpen }))}
                      className="text-sm font-medium text-gray-900 flex items-center gap-2"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      #{v?._id?.slice(-6)} — {summary}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {(!v.regularPrice || v.regularPrice <= 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setValue(`variations.${idx}.regularPrice` as any, product?.regularPrice || 0, { shouldDirty: true })
                          setExpanded((prev) => ({ ...prev, [v._id]: true }))
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Add price
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Delete this variation?')) return
                        const current = variationsValues || []
                        const remaining = current.filter((_, i) => i !== idx)
                        reset({ variations: remaining })
                        setExpanded((prev) => {
                          const copy = { ...prev }
                          if (v?._id) {
                            delete (copy as any)[v._id]
                          }
                          return copy
                        })
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="p-4 space-y-6">
                    {/* Variation Image and Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Variation image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center h-32 bg-gray-50">
                          {v?.image ? (
                            <div className="relative w-full h-full">
                              <img
                                src={getImageUrl(v.image)}
                                alt="Variation"
                                loading="lazy"
                                className="w-full h-full object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const formData = new FormData()
                                    const input = document.createElement('input')
                                    input.type = 'file'
                                    input.accept = 'image/*'
                                    input.onchange = async (e: any) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      formData.append('image', file)
                                      const response = await api.post('/products/upload-image', formData, {
                                        headers: { 'Content-Type': 'multipart/form-data' },
                                      })
                                      if (response.data.success && response.data.data?.url) {
                                        let imageUrl = response.data.data.url
                                        if (imageUrl.startsWith('/')) {
                                          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
                                          const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '')
                                          imageUrl = baseUrl + imageUrl
                                        }
                                        setValue(`variations.${idx}.image` as any, imageUrl, { shouldDirty: true })
                                      }
                                    }
                                    input.click()
                                  } catch (error: any) {
                                    alert(error?.response?.data?.error || 'Failed to upload image')
                                  }
                                }}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const formData = new FormData()
                                  const input = document.createElement('input')
                                  input.type = 'file'
                                  input.accept = 'image/*'
                                  input.onchange = async (e: any) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    formData.append('image', file)
                                    const response = await api.post('/products/upload-image', formData, {
                                      headers: { 'Content-Type': 'multipart/form-data' },
                                    })
                                    if (response.data.success && response.data.data?.url) {
                                      let imageUrl = response.data.data.url
                                      if (imageUrl.startsWith('/')) {
                                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
                                        const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '')
                                        imageUrl = baseUrl + imageUrl
                                      }
                                      setValue(`variations.${idx}.image` as any, imageUrl, { shouldDirty: true })
                                    }
                                  }
                                  input.click()
                                } catch (error: any) {
                                  alert(error?.response?.data?.error || 'Failed to upload image')
                                }
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <ImageIcon className="w-8 h-8" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* SKU and GTIN */}
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                          <input
                            {...register(`variations.${idx}.sku` as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="SKU"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">GTIN, UPC, EAN, or ISBN</label>
                          <input
                            {...register(`variations.${idx}.barcode` as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="GTIN, UPC, EAN, or ISBN"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Attribute Selections */}
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
                            <option value="">Select {attr.name}...</option>
                            {attr.values.map((val: string) => (
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Regular price <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register(`variations.${idx}.regularPrice` as any, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Variation price (required)"
                        />
                        <p className="text-xs text-gray-500 mt-1">Each variation can have a different price</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Sale price</label>
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.preventDefault()
                              // TODO: Implement schedule sale price functionality
                              alert('Schedule sale price feature coming soon')
                            }}
                          >
                            Schedule
                          </button>
                        </div>
                        <input
                          {...register(`variations.${idx}.salePrice` as any, {
                            setValueAs: (v) => {
                              if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                              return Number(v)
                            },
                          })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Sale price"
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional discounted price for this variation</p>
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
                          {...register(`variations.${idx}.stockQty` as any, {
                            setValueAs: (v) => {
                              if (v === '' || v === null || v === undefined || isNaN(Number(v))) return undefined
                              return Number(v)
                            },
                          })}
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
                        <select
                          {...register(`variations.${idx}.shippingClass` as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Same as parent</option>
                          <option value="standard">Standard</option>
                          <option value="express">Express</option>
                          <option value="overnight">Overnight</option>
                        </select>
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

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {fields.length} variation{fields.length !== 1 ? 's' : ''} (
              <button
                type="button"
                onClick={() => {
                  const all = Object.fromEntries((variationsValues || []).map((v) => [v._id, true]))
                  setExpanded(all)
                }}
                className="text-blue-600 hover:underline"
              >
                Expand / Close
              </button>
              )
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExpanded({})}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(onSaveVariations)()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save changes
              </button>
            </div>
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
  const [showSchedulePublish, setShowSchedulePublish] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [scheduledTime, setScheduledTime] = useState<string>('')

  const { data: product, isLoading } = useProduct(id || '')
  const queryClient = useQueryClient()

  // Local product form values type (decoupled from shared API schema)
  type ProductFormValues = {
    title?: string
    slug?: string
    status?: 'draft' | 'published' | 'private'
    visibility?: 'visible' | 'catalog' | 'search' | 'hidden'
    featured?: boolean
    shortDescription?: string
    description?: string
    featuredImage?: string
    gallery?: string[]
    regularPrice?: number
    salePrice?: number
    saleStart?: string
    saleEnd?: string
    type?: 'simple' | 'variable'
    sku?: string
    barcode?: string
    soldIndividually?: boolean
    manageStock?: boolean
    stockQty?: number
    stockStatus?: 'in_stock' | 'out_of_stock' | 'backorder'
    lowStockThreshold?: number
    backorderPolicy?: 'no' | 'notify' | 'allow'
    weight?: number
    dimensions?: {
      length?: number
      width?: number
      height?: number
    }
    shippingClass?: string
    categoryIds?: string[]
    tags?: string[]
    attributes?: any[]
    metaTitle?: string
    metaDescription?: string
  }

  // Convert Product to ProductFormValues format (Date -> string)
  const getDefaultValues = (): ProductFormValues => {
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
        tags: [],
        attributes: [],
      }
    }

    const normalizeIdArray = (ids: any[] | undefined | null): string[] => {
      if (!ids) return []
      return ids
        .map((v: any) => {
          if (!v) return null
          if (typeof v === 'string') return v
          if (typeof v === 'object' && v._id) return String(v._id)
          return String(v)
        })
        .filter((v: any): v is string => typeof v === 'string' && v.trim() !== '')
    }

    const tagNames: string[] =
      (product as any).tags && Array.isArray((product as any).tags)
        ? (product as any).tags
        : Array.isArray((product as any).tagIds)
        ? (product as any).tagIds
            .map((t: any) =>
              t && typeof t === 'object' && t.name ? t.name : typeof t === 'string' ? t : null
            )
            .filter((n: any): n is string => typeof n === 'string' && n.trim() !== '')
        : []

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
      // Convert sale dates to YYYY-MM-DD strings for date inputs
      saleStart: product.saleStart ? product.saleStart.toISOString().slice(0, 10) : undefined,
      saleEnd: product.saleEnd ? product.saleEnd.toISOString().slice(0, 10) : undefined,
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
      categoryIds: normalizeIdArray(product.categoryIds as any),
      tags: tagNames,
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
  } = useForm<ProductFormValues>({
    // No shared Zod schema here; simple local validation in onSubmit
    mode: 'onSubmit',
    defaultValues: getDefaultValues(),
  })

  // Reset form when product data loads
  useEffect(() => {
    if (product && !isNew) {
      reset(getDefaultValues())
      // Also update the type field explicitly to ensure it's synced
      if (product.type) {
        setValue('type', product.type)
      }
    }
  }, [product, isNew, reset, setValue])

  // Clean up dimensions object in real-time to prevent validation errors
  // If all fields are empty, set dimensions to undefined
  // Otherwise, keep the dimensions object with only the filled fields
  const dimensions = watch('dimensions')
  const saleStart = watch('saleStart')
  const saleEnd = watch('saleEnd')
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

  const [showSaleSchedule, setShowSaleSchedule] = useState<boolean>(false)

  // Categories quick-add state for sidebar
  const { data: sidebarCategories } = useCategories()
  const createCategory = useCreateCategory()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryParentId, setNewCategoryParentId] = useState('')

  const handleQuickAddCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) {
      alert('Category name is required')
      return
    }

    try {
      const payload: any = { name }
      if (newCategoryParentId) {
        payload.parentId = newCategoryParentId
      }

      const result: any = await createCategory.mutateAsync(payload)
      const created = result?.data || result
      const newId: string | undefined = created?._id

      if (newId) {
        const current = (watch('categoryIds') || []) as string[]
        if (!current.includes(newId)) {
          setValue('categoryIds', [...current, newId], { shouldDirty: true })
        }
      }

      setNewCategoryName('')
      setNewCategoryParentId('')
    } catch (error: any) {
      console.error('Error creating category from product form:', error)
      alert(error?.response?.data?.error || 'Failed to create category')
    }
  }

  // If product already has sale dates, auto-open the schedule section
  useEffect(() => {
    if (saleStart || saleEnd) {
      setShowSaleSchedule(true)
    }
  }, [saleStart, saleEnd])

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

  const onSubmit = async (data: ProductFormValues, opts?: { stay?: boolean; nextTab?: ProductDataTab }) => {
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

      // Clean up optional numeric fields - convert NaN to undefined
      // This happens when valueAsNumber: true is used with empty inputs
      if (data.salePrice !== undefined && (isNaN(data.salePrice) || data.salePrice === null)) {
        data.salePrice = undefined
      }
      if (data.weight !== undefined && (isNaN(data.weight) || data.weight === null)) {
        data.weight = undefined
      }
      if (data.stockQty !== undefined && (isNaN(data.stockQty) || data.stockQty === null)) {
        data.stockQty = undefined
      }
      if (data.lowStockThreshold !== undefined && (isNaN(data.lowStockThreshold) || data.lowStockThreshold === null)) {
        data.lowStockThreshold = undefined
      }

      // For draft products, allow saving with minimal data (e.g., just attributes)
      // Title is only required when publishing
      const isDraft = data.status === 'draft' || (product?.status === 'draft' && !data.status)
      const isPublishing = data.status && data.status !== 'draft' && (data.status === 'published' || data.status === 'private')
      
      // Only require title if publishing
      if (isPublishing && (!data.title || data.title.trim() === '')) {
        alert('Product name is required to publish a product')
        setFocus('title')
        return
      }
      
      // For draft products (new or existing), allow empty title or auto-generate
      if (isDraft) {
        if (!data.title || data.title.trim() === '') {
          // Don't send empty title - let existing title remain or use default
          if (isNew) {
            data.title = 'Draft Product'
          } else {
            // For existing products, don't update title if empty - remove from updateData
            const { title, ...restData } = data
            Object.assign(data, restData)
          }
        }
      }
      
      // Clean up empty title strings - don't send them to API
      if (data.title !== undefined && data.title.trim() === '') {
        if (isNew) {
          data.title = 'Draft Product'
        } else {
          // Remove title from update data
          const { title, ...restData } = data
          Object.assign(data, restData)
        }
      }

      // Regular price is only required for published products or when not just saving attributes
      // Allow saving attributes even without price for draft products
      if (!isDraft && (!data.regularPrice || data.regularPrice <= 0)) {
        alert('Regular price must be greater than 0')
        return
      }
      
      // For draft products, set a default price if missing
      if (isDraft && (!data.regularPrice || data.regularPrice <= 0)) {
        data.regularPrice = 0
      }

      // Clean up attributes - convert attributeId from object to string if needed
      // Also ensure values are strings (not objects)
      if (data.attributes && Array.isArray(data.attributes)) {
        data.attributes = data.attributes.map((attr: any) => {
          // Convert attributeId from object to string
          let attributeId = ''
          if (attr.attributeId) {
            if (typeof attr.attributeId === 'object' && attr.attributeId !== null) {
              attributeId = (attr.attributeId as any)._id || String(attr.attributeId)
            } else {
              attributeId = String(attr.attributeId)
            }
          }

          // Convert values array - ensure all values are strings
          let values: string[] = []
          if (Array.isArray(attr.values)) {
            values = attr.values.map((v: any) => {
              // If value is an object, extract name or _id, otherwise convert to string
              if (typeof v === 'object' && v !== null) {
                return v.name || v._id || String(v)
              }
              return String(v)
            }).filter((v: string) => v && v.trim() !== '') // Remove empty values
          }

          return {
            attributeId,
            name: attr.name || '',
            values,
            usedForVariations: attr.usedForVariations || false,
            visibleOnProductPage: attr.visibleOnProductPage !== false,
            position: attr.position || 0,
          }
        }).filter((attr: any) => attr.attributeId && attr.attributeId.trim() !== '') // Remove attributes without valid attributeId
      } else if (!isNew && data.attributes === undefined) {
        // For updates, if attributes is not provided, don't send it (to avoid overwriting existing attributes)
        // Use object destructuring to remove attributes from the payload
        const { attributes, ...restData } = data
        Object.assign(data, restData)
      }

      // Build publish schedule info for API:
      // - mode: 'immediate' or 'scheduled'
      // - publishAt: ISO datetime when scheduled, or undefined for immediate
      let publishMode: 'immediate' | 'scheduled' = 'immediate'
      let publishAt: string | undefined
      if (scheduledDate) {
        publishMode = 'scheduled'
        const time = scheduledTime && scheduledTime.trim() ? scheduledTime : '00:00'
        const localIso = new Date(`${scheduledDate}T${time}:00`).toISOString()
        publishAt = localIso
      }

      const payload = {
        ...data,
        publishSchedule: {
          mode: publishMode,
          date: scheduledDate || null,
          time: scheduledTime || null,
          publishAt,
        },
      }

      if (isNew) {
        await api.post('/products', payload)
        // Refresh product list cache
        queryClient.invalidateQueries({ queryKey: ['products'] })

        // Show success message
        alert('Product created successfully.')

        // After creating a new product, go back to the products list unless caller wants to stay
        if (!opts?.stay) {
          navigate('/products')
        }
      } else if (id) {
        // Update existing product
        await api.patch(`/products/${id}`, payload)

        // Refresh caches for this product and the list
        queryClient.invalidateQueries({ queryKey: ['product', id] })
        queryClient.invalidateQueries({ queryKey: ['products'] })

        alert('Product updated successfully.')
      }
    } catch (error) {
      console.error('Error while preparing product payload:', error)
    }
  }

  const onInvalid = (invalidErrors: any) => {
    // Check current tab and product status
    const currentStatus = watch('status')
    const isDraft = currentStatus === 'draft'
    const titleValue = watch('title')
    const titleError = errors.title || invalidErrors?.title
    
    // For draft products, be more lenient with title requirement
    // Only require title if publishing
    if (!isDraft && (!titleValue || (typeof titleValue === 'string' && titleValue.trim() === '') || titleError)) {
      setFocus('title')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      alert('Please enter Product Name before publishing.')
      return
    }
    
    // For draft products, allow saving even without title (will auto-generate)
    // Show other validation errors
    const errorFields = Object.keys(invalidErrors || errors).filter(key => {
      // Skip title error for draft products
      if (key === 'title' && isDraft) return false
      return true
    })
    
    if (errorFields.length > 0) {
      const errorMessages = errorFields.map(field => {
        const error = invalidErrors?.[field] || errors[field as keyof typeof errors]
        return `${field}: ${error?.message || 'Invalid'}`
      }).join('\n')
      alert(`Please fix the following errors:\n${errorMessages}`)
    } else if (!isDraft && (!titleValue || titleValue.trim() === '')) {
      // Only show title error for non-draft products
      setFocus('title')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      alert('Please enter Product Name before saving.')
    }
  }

  const saveAndStay = (nextTab?: ProductDataTab) => {
    handleSubmit(
      (data) => {
        onSubmit(data, { stay: true, nextTab })
      },
      (errors) => {
        onInvalid(errors)
      }
    )()
  }

  // Save only attributes (like WooCommerce save_attributes action)
  // Here "save" just means validate + normalize them into the main form state.
  // No separate API call – attributes will be sent when the main product is saved.
  const saveAttributesOnly = async () => {
    try {
      await handleSubmit(
        (data) => {
          const rawAttributes = (data as any).attributes || []
          const normalized = rawAttributes.map((attr: any, index: number) => ({
            attributeId:
              typeof attr.attributeId === 'object' && attr.attributeId !== null
                ? (attr.attributeId as any)._id || String(attr.attributeId)
                : String(attr.attributeId || ''),
            name: attr.name,
            values: Array.isArray(attr.values) ? attr.values : [],
            usedForVariations: !!attr.usedForVariations,
            visibleOnProductPage: attr.visibleOnProductPage !== false,
            position: attr.position ?? index,
          }))

          setValue('attributes', normalized as any, { shouldDirty: true })
          alert('Attributes saved into the product form. Click Update/Publish to send them to the API.')
        },
        () => {
          alert('Please fix validation errors before saving attributes.')
        }
      )()
    } catch (error: any) {
      console.error('Error preparing attributes:', error)
    }
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
                  {...register('salePrice', {
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
                <button
                  type="button"
                  onClick={() => setShowSaleSchedule((prev) => !prev)}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  {showSaleSchedule ? 'Cancel schedule' : 'Schedule'}
                </button>
                {showSaleSchedule && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sale start date</label>
                      <input
                        {...register('saleStart')}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sale end date</label>
                      <input
                        {...register('saleEnd')}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                )}
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
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GTIN, UPC, EAN, or ISBN</label>
                        <input
                          {...register('barcode')}
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock status</label>
                      <select
                        {...register('stockStatus')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="in_stock">In stock</option>
                        <option value="out_of_stock">Out of stock</option>
                        <option value="backorder">On backorder</option>
                      </select>
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
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Low stock threshold</label>
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Allow backorders?</label>
                          <div className="space-y-2">
                            <label className="flex items-center text-sm text-gray-700">
                              <input
                                {...register('backorderPolicy')}
                                type="radio"
                                value="no"
                                className="w-4 h-4 text-blue-600 border-gray-300"
                              />
                              <span className="ml-2">Do not allow</span>
                            </label>
                            <label className="flex items-center text-sm text-gray-700">
                              <input
                                {...register('backorderPolicy')}
                                type="radio"
                                value="notify"
                                className="w-4 h-4 text-blue-600 border-gray-300"
                              />
                              <span className="ml-2">Allow, but notify customer</span>
                            </label>
                            <label className="flex items-center text-sm text-gray-700">
                              <input
                                {...register('backorderPolicy')}
                                type="radio"
                                value="allow"
                                className="w-4 h-4 text-blue-600 border-gray-300"
                              />
                              <span className="ml-2">Allow</span>
                            </label>
                          </div>
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
                    // Save attributes only updates form state; it does not call any API.
                    onSave={saveAttributesOnly}
                  />
                )}

                {/* Variations (variable only) */}
                {activeTab === 'variations' && productType === 'variable' && (
                  <ProductVariationsTab
                    product={product}
                    productId={product?._id || id || ''}
                    onSaveProduct={() => saveAndStay('variations')}
                    attributesForVariations={(watch('attributes') as any[]) || []}
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
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {/* Publish immediately / schedule */}
              <div className="text-sm text-gray-700">
                <span className="mr-1">Publish</span>
                {!showSchedulePublish ? (
                  <>
                    {scheduledDate ? (
                      <>
                        <span className="font-semibold">
                          scheduled for {scheduledDate}
                          {scheduledTime ? ` ${scheduledTime}` : ''}
                        </span>{' '}
                      </>
                    ) : (
                      <span className="font-semibold">immediately</span>
                    )}{' '}
                    <button
                      type="button"
                      onClick={() => setShowSchedulePublish(true)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs flex-1"
                      />
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-28"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          // For now just close the editor; scheduling logic can be wired to API later
                          setShowSchedulePublish(false)
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSchedulePublish(false)
                          setScheduledDate('')
                          setScheduledTime('')
                        }}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  {...register('visibility')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="visible">Visible</option>
                  <option value="catalog">Catalog</option>
                  <option value="search">Search</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              {/* Featured */}
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
            <CategoryTreeSelector
              selectedCategoryIds={watch('categoryIds') || []}
              onSelectionChange={(categoryIds) => setValue('categoryIds', categoryIds, { shouldValidate: true })}
            />
            {errors.categoryIds && <p className="text-red-600 text-sm mt-2">{errors.categoryIds.message}</p>}

            {/* Quick add category */}
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-gray-600 mb-2">Add new category</p>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Parent category</label>
                  <select
                    value={newCategoryParentId}
                    onChange={(e) => setNewCategoryParentId(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="">None</option>
                    {(sidebarCategories || [])
                      .filter((cat) => !cat.parentId)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    disabled={!newCategoryName.trim() || createCategory.isPending}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Product Tags</h3>
            <p className="text-sm text-gray-500 mb-4">Select tags for this product or create new ones</p>
            <TagSelector
              selectedTags={watch('tags') || []}
              onSelectionChange={(tags) => setValue('tags', tags, { shouldValidate: true })}
            />
            {errors.tags && <p className="text-red-600 text-sm mt-2">{errors.tags.message}</p>}
          </div>

        </div>
      </div>
    </form>
  )
}
