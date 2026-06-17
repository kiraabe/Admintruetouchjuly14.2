import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import SessionAuditService, { LogoutReason, LogoutType } from './SessionAuditService'

// ─── Constants ────────────────────────────────────────────────────────────────

const INACTIVITY_LIMIT = 30 * 60 * 1000   // 30 minutes
const WARNING_TIME = 2 * 60 * 1000    //  2 minutes before timeout
const ABSOLUTE_LIMIT = 8 * 60 * 60 * 1000 // 8-hour hard cap per session

// ─── Module-level state ───────────────────────────────────────────────────────

let inactivityTimeout: NodeJS.Timeout | null = null
let warningTimeout: NodeJS.Timeout | null = null
let absoluteTimeout: NodeJS.Timeout | null = null
let storageListener: ((e: StorageEvent) => void) | null = null
let axiosInterceptorId: number | null = null

// ─── Callback contract ────────────────────────────────────────────────────────

interface SessionCallbacks {
  onWarning?: (timeLeft: number) => void
  onExpire?: () => void
}

let sessionCallbacks: SessionCallbacks = {}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return Cookies.get('token') || localStorage.getItem('token') || null
}

function safeRead(key: string): string | null {
  try { return localStorage.getItem(key) }
  catch { return null }
}

// ─── Core service ─────────────────────────────────────────────────────────────

export const SessionService = {

  // ── Callback registration ──────────────────────────────────────────────────

  setCallbacks(callbacks: SessionCallbacks): void {
    sessionCallbacks = callbacks
  },

  // ── Inactivity timer ──────────────────────────────────────────────────────

  resetInactivityTimer(): void {
    if (inactivityTimeout) clearTimeout(inactivityTimeout)
    if (warningTimeout) clearTimeout(warningTimeout)

    warningTimeout = setTimeout(() => {
      sessionCallbacks.onWarning?.(WARNING_TIME)
    }, INACTIVITY_LIMIT - WARNING_TIME)

    inactivityTimeout = setTimeout(() => {
      SessionService.expireSession(
        LogoutReason.SESSION_TIMEOUT_INACTIVITY,
        LogoutType.AUTOMATIC
      )
    }, INACTIVITY_LIMIT)
  },

  /**
   * Start an absolute session clock. Call once right after login.
   * Regardless of user activity, the session expires after ABSOLUTE_LIMIT.
   */
  startAbsoluteTimer(): void {
    if (absoluteTimeout) clearTimeout(absoluteTimeout)
    absoluteTimeout = setTimeout(() => {
      SessionService.expireSession(
        LogoutReason.ABSOLUTE_SESSION_EXPIRATION,
        LogoutType.AUTOMATIC
      )
    }, ABSOLUTE_LIMIT)
  },

  // ── Token refresh ─────────────────────────────────────────────────────────

  async extendSession(): Promise<boolean> {
    try {
      const token = getToken()
      if (!token) {
        SessionService.expireSession(
          LogoutReason.MISSING_SESSION_IDENTIFIER,
          LogoutType.AUTOMATIC
        )
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

      // Refresh endpoint returned 2xx but no token — treat as failure
      SessionService.expireSession(
        LogoutReason.TOKEN_REFRESH_FAILED,
        LogoutType.AUTOMATIC
      )
      return false

    } catch (error) {
      const axiosErr = error as AxiosError
      const status = axiosErr?.response?.status

      const reason =
        status === 401 ? LogoutReason.ACCESS_TOKEN_EXPIRED :
          status === 403 ? LogoutReason.REFRESH_TOKEN_EXPIRED :
            LogoutReason.TOKEN_REFRESH_FAILED

      SessionService.expireSession(reason, LogoutType.AUTOMATIC)
      return false
    }
  },

  // ── Axios interceptor (global 401 / 403 guard) ────────────────────────────

  /**
   * Register a global Axios response interceptor that expires the session on
   * HTTP 401 / 403 from any endpoint (except /auth/refresh, handled separately).
   * Safe to call multiple times — previous interceptor is removed first.
   */
  registerAxiosInterceptor(): void {
    if (axiosInterceptorId !== null) {
      axios.interceptors.response.eject(axiosInterceptorId)
    }

    axiosInterceptorId = axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const cfg = error.config as InternalAxiosRequestConfig & { _skipSessionCheck?: boolean }
        const status = error.response?.status
        const url = cfg?.url ?? ''

        // Skip the refresh endpoint itself to prevent loops
        const isRefreshCall = url.includes('/auth/refresh')
        if (isRefreshCall || cfg?._skipSessionCheck) {
          return Promise.reject(error)
        }

        if (status === 401) {
          SessionService.expireSession(
            LogoutReason.HTTP_401_UNAUTHORIZED,
            LogoutType.AUTOMATIC,
            { url, status }
          )
        } else if (status === 403) {
          SessionService.expireSession(
            LogoutReason.HTTP_403_FORBIDDEN,
            LogoutType.AUTOMATIC,
            { url, status }
          )
        }

        return Promise.reject(error)
      }
    )
  },

  // ── Storage event guard (multi-tab token removal) ─────────────────────────

  /**
   * Listen for `storage` events so that if the token is removed in another tab
   * (logout, cache clear, extension) this tab also expires cleanly.
   */
  registerStorageListener(): void {
    if (storageListener) {
      window.removeEventListener('storage', storageListener)
    }

    storageListener = (e: StorageEvent) => {
      if (e.key === 'token' && (e.newValue === null || e.newValue === '')) {
        // Another tab cleared the token
        SessionService.expireSession(
          LogoutReason.TOKEN_CONFLICT_MULTI_TAB,
          LogoutType.AUTOMATIC,
          { triggeredByStorageEvent: true, oldTabToken: !!e.oldValue }
        )
      }
      if (e.key === 'user' && (e.newValue === null || e.newValue === '')) {
        SessionService.expireSession(
          LogoutReason.MISSING_CLIENT_SIDE_USER_DATA,
          LogoutType.AUTOMATIC,
          { triggeredByStorageEvent: true }
        )
      }
    }

    window.addEventListener('storage', storageListener)
  },

  // ── Validation checks (call from route guards / page init) ────────────────

  /**
   * Validate that all required client-side session artefacts are present.
   * Call this from route guards or on authenticated page load.
   * Returns `true` if the session is valid, `false` if it has been expired.
   */
  validateClientSession(): boolean {
    const token = getToken()

    if (!token) {
      SessionService.expireSession(
        LogoutReason.MISSING_SESSION_IDENTIFIER,
        LogoutType.AUTOMATIC
      )
      return false
    }

    // Check for corrupted / missing user data
    const rawUser = safeRead('user') || safeRead('sessionUser')
    if (!rawUser) {
      SessionService.expireSession(
        LogoutReason.MISSING_CLIENT_SIDE_USER_DATA,
        LogoutType.AUTOMATIC
      )
      return false
    }

    try {
      const parsed = JSON.parse(rawUser)
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('invalid shape')
      }
    } catch {
      SessionService.expireSession(
        LogoutReason.CORRUPTED_USER_PROFILE_STATE,
        LogoutType.AUTOMATIC
      )
      return false
    }

    return true
  },

  /**
   * Forcibly expire the session for a known security / infrastructure reason.
   * The caller supplies the specific LogoutReason so the audit record is precise.
   */
  expireSession(
    reason: LogoutReason = LogoutReason.MANUAL_LOGOUT,
    logoutType: LogoutType = LogoutType.MANUAL,
    context?: Record<string, unknown>
  ): void {
    // 1. Stop all timers first to prevent double-firing
    SessionService.clearTimers()

    // 2. Dispatch audit log entry (non-blocking; storage still available here)
    SessionAuditService.log(reason, logoutType, context).catch(() => {
      /* audit failure must never block logout */
    })

    // 3. Remove auth state
    try { localStorage.removeItem('token') } catch { /* ignore */ }
    try { localStorage.removeItem('user') } catch { /* ignore */ }
    try { localStorage.removeItem('sessionUser') } catch { /* ignore */ }
    try { sessionStorage.clear() } catch { /* ignore */ }
    Cookies.remove('token')

    // 4. Tear down listeners
    if (storageListener) {
      window.removeEventListener('storage', storageListener)
      storageListener = null
    }
    if (axiosInterceptorId !== null) {
      axios.interceptors.response.eject(axiosInterceptorId)
      axiosInterceptorId = null
    }

    // 5. Notify UI layer
    sessionCallbacks.onExpire?.()

    // 6. Redirect
    window.location.href = '/sign-in'
  },

  // ── Manual user logout ────────────────────────────────────────────────────

  logout(): void {
    SessionService.expireSession(LogoutReason.MANUAL_LOGOUT, LogoutType.MANUAL)
  },

  // ── Forced / admin-triggered logouts ──────────────────────────────────────

  forceLogout(reason: LogoutReason, context?: Record<string, unknown>): void {
    SessionService.expireSession(reason, LogoutType.FORCED, context)
  },

  // ── Utility ───────────────────────────────────────────────────────────────

  clearTimers(): void {
    if (inactivityTimeout) { clearTimeout(inactivityTimeout); inactivityTimeout = null }
    if (warningTimeout) { clearTimeout(warningTimeout); warningTimeout = null }
    if (absoluteTimeout) { clearTimeout(absoluteTimeout); absoluteTimeout = null }
  },

  getTimeLeft(): number {
    return INACTIVITY_LIMIT
  },
}

export default SessionService