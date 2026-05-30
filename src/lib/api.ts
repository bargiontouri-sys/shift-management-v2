import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
})

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('bs_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  e => {
    if (e.response?.status === 401 || e.response?.status === 403) {
      localStorage.removeItem('bs_token')
      localStorage.removeItem('bs_staff')
      window.location.href = '/login'
    }
    return Promise.reject(e)
  }
)
