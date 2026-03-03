// Helper to build full image URL from relative paths using API base from env
export const getImageUrl = (imagePath?: string | null): string | undefined => {
  if (!imagePath) return undefined
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  if (imagePath.startsWith('/')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
    const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '')
    return baseUrl + imagePath
  }
  return imagePath
}
