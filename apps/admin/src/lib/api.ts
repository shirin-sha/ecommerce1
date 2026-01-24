import axios from 'axios'

// Use environment variable for API URL, fallback to relative path for local dev
// Ensure API_URL always ends with /api/v1
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) {
    // If VITE_API_URL is set, ensure it ends with /api/v1
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`
  }
  // Fallback for local dev
  return typeof window !== 'undefined' ? window.location.origin + '/api/v1' : '/api/v1'
}

const API_URL = getApiUrl()

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests and handle FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // If data is FormData, remove Content-Type header so axios can set it with boundary automatically
  if (config.data instanceof FormData) {
    // Delete from headers object (axios uses this)
    delete config.headers['Content-Type']
    delete config.headers['content-type']
    // Also ensure transformRequest doesn't interfere
    config.transformRequest = [(data) => data]
  }
  
  return config
})

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        const { accessToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
