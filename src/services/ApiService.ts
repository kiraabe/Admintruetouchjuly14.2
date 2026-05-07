import axios from 'axios'
import Cookies from 'js-cookie'

const AxiosBase = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
})

AxiosBase.interceptors.request.use((config) => {
  const token = Cookies.get('token') || localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

AxiosBase.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token')
      localStorage.removeItem('token')
      window.location.href = '/sign-in'
    }
    return Promise.reject(error)
  },
)

class ApiService {
  static async fetchDataWithAxios<T>(config: any): Promise<T> {
    const response = await AxiosBase(config)
    return response.data
  }
}

export default ApiService
