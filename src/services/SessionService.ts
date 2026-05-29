import axios from 'axios'
import Cookies from 'js-cookie'

let inactivityTimeout: NodeJS.Timeout | null = null
let warningTimeout: NodeJS.Timeout | null = null
const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 minutes
const WARNING_TIME = 2 * 60 * 1000 // 2 minutes before timeout

interface SessionCallbacks {
  onWarning?: (timeLeft: number) => void
  onExpire?: () => void
}

let sessionCallbacks: SessionCallbacks = {}

export const SessionService = {
  setCallbacks: (callbacks: SessionCallbacks) => {
    sessionCallbacks = callbacks
  },

  resetInactivityTimer: () => {
    // Clear existing timers
    if (inactivityTimeout) clearTimeout(inactivityTimeout)
    if (warningTimeout) clearTimeout(warningTimeout)

    // Set warning timeout (fires 2 minutes before expiration)
    warningTimeout = setTimeout(() => {
      sessionCallbacks.onWarning?.(WARNING_TIME)
    }, INACTIVITY_LIMIT - WARNING_TIME)

    // Set expiration timeout
    inactivityTimeout = setTimeout(() => {
      SessionService.expireSession()
    }, INACTIVITY_LIMIT)
  },

  extendSession: async () => {
    try {
      const token = Cookies.get('token') || localStorage.getItem('token')
      if (!token) {
        SessionService.expireSession()
        return false
      }

      const response = await axios.post(
        '/api/auth/refresh',
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
        }
      )

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token)
        Cookies.set('token', response.data.token)
        SessionService.resetInactivityTimer()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to extend session:', error)
      return false
    }
  },

  expireSession: () => {
    // Clear all timers
    if (inactivityTimeout) clearTimeout(inactivityTimeout)
    if (warningTimeout) clearTimeout(warningTimeout)

    // Clear authentication
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.clear()

    // Trigger callback
    sessionCallbacks.onExpire?.()

    // Redirect to login
    window.location.href = '/login'
  },

  clearTimers: () => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout)
    if (warningTimeout) clearTimeout(warningTimeout)
  },

  getTimeLeft: (): number => {
    return INACTIVITY_LIMIT
  },
}

export default SessionService
