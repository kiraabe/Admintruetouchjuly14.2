import axios from 'axios'
import Cookies from 'js-cookie'

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum LogoutReason {
  // Inactivity / time-based
  SESSION_TIMEOUT_INACTIVITY = 'SESSION_TIMEOUT_INACTIVITY',
  ABSOLUTE_SESSION_EXPIRATION = 'ABSOLUTE_SESSION_EXPIRATION',
  // Token / credential failures
  INVALID_SESSION_IDENTIFIER = 'INVALID_SESSION_IDENTIFIER',
  MISSING_SESSION_IDENTIFIER = 'MISSING_SESSION_IDENTIFIER',
  ACCESS_TOKEN_EXPIRED = 'ACCESS_TOKEN_EXPIRED',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  TOKEN_CONFLICT_MULTI_TAB = 'TOKEN_CONFLICT_MULTI_TAB',
  // HTTP / API
  HTTP_401_UNAUTHORIZED = 'HTTP_401_UNAUTHORIZED',
  HTTP_403_FORBIDDEN = 'HTTP_403_FORBIDDEN',
  // Security / integrity
  SUSPICIOUS_ACTIVITY_DETECTED = 'SUSPICIOUS_ACTIVITY_DETECTED',
  EXCESSIVE_FAILED_AUTH_ATTEMPTS = 'EXCESSIVE_FAILED_AUTH_ATTEMPTS',
  CSRF_TOKEN_VALIDATION_FAILURE = 'CSRF_TOKEN_VALIDATION_FAILURE',
  SESSION_HIJACKING_PROTECTION = 'SESSION_HIJACKING_PROTECTION',
  IP_ADDRESS_CHANGE = 'IP_ADDRESS_CHANGE',
  BROWSER_FINGERPRINT_MISMATCH = 'BROWSER_FINGERPRINT_MISMATCH',
  CONCURRENT_LOGIN_SINGLE_SESSION_POLICY = 'CONCURRENT_LOGIN_SINGLE_SESSION_POLICY',
  // Storage / client-side
  SESSION_STORAGE_FAILURE = 'SESSION_STORAGE_FAILURE',
  COOKIES_DISABLED_OR_DELETED = 'COOKIES_DISABLED_OR_DELETED',
  BROWSER_CACHE_CLEARED = 'BROWSER_CACHE_CLEARED',
  LOCAL_STORAGE_TOKEN_REMOVED = 'LOCAL_STORAGE_TOKEN_REMOVED',
  SESSION_STORAGE_TOKEN_REMOVED = 'SESSION_STORAGE_TOKEN_REMOVED',
  PRIVATE_BROWSING_SESSION_CLOSED = 'PRIVATE_BROWSING_SESSION_CLOSED',
  BROWSER_EXTENSION_INTERFERENCE = 'BROWSER_EXTENSION_INTERFERENCE',
  MISSING_CLIENT_SIDE_USER_DATA = 'MISSING_CLIENT_SIDE_USER_DATA',
  CORRUPTED_USER_PROFILE_STATE = 'CORRUPTED_USER_PROFILE_STATE',
  APP_STATE_RESET = 'APP_STATE_RESET',
  // Auth changes / account events
  MANUAL_LOGOUT = 'MANUAL_LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  ROLE_PERMISSION_CHANGE_REQUIRES_REAUTH = 'ROLE_PERMISSION_CHANGE_REQUIRES_REAUTH',
  // Route / guard failures
  ROUTE_GUARD_FAILURE = 'ROUTE_GUARD_FAILURE',
  AUTH_GUARD_FAILURE = 'AUTH_GUARD_FAILURE',
  // Infrastructure / backend
  SERVER_RESTART_SESSION_INVALIDATED = 'SERVER_RESTART_SESSION_INVALIDATED',
  DATABASE_CONNECTIVITY_FAILURE = 'DATABASE_CONNECTIVITY_FAILURE',
  REDIS_CACHE_CLEARED = 'REDIS_CACHE_CLEARED',
  LOAD_BALANCER_SESSION_INCONSISTENCY = 'LOAD_BALANCER_SESSION_INCONSISTENCY',
  BACKEND_DEPLOYMENT_SESSION_INVALIDATED = 'BACKEND_DEPLOYMENT_SESSION_INVALIDATED',
  REVERSE_PROXY_SESSION_INCONSISTENCY = 'REVERSE_PROXY_SESSION_INCONSISTENCY',
  SERVER_MAINTENANCE = 'SERVER_MAINTENANCE',
  // Configuration / network
  CORS_CREDENTIAL_MISCONFIGURATION = 'CORS_CREDENTIAL_MISCONFIGURATION',
  AUTH_ENV_CONFIG_CHANGE = 'AUTH_ENV_CONFIG_CHANGE',
  SSL_SECURE_COOKIE_MISCONFIGURATION = 'SSL_SECURE_COOKIE_MISCONFIGURATION',
  DOMAIN_COOKIE_MISMATCH = 'DOMAIN_COOKIE_MISMATCH',
  SYSTEM_CLOCK_SYNC_ISSUE = 'SYSTEM_CLOCK_SYNC_ISSUE',
  AXIOS_INTERCEPTOR_TRIGGERED = 'AXIOS_INTERCEPTOR_TRIGGERED',
  FETCH_INTERCEPTOR_TRIGGERED = 'FETCH_INTERCEPTOR_TRIGGERED',
}

export enum LogoutType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  FORCED = 'FORCED',
  PREVENTIVE = 'PREVENTIVE',
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  userId: string | null
  sessionId: string | null
  reason: LogoutReason
  logoutType: LogoutType
  ipAddress: string | null
  device: string
  browser: string
  loginTime: string | null
  logoutTime: string
  sessionDurationSeconds: number | null
  timestamp: string
  additionalContext?: Record<string, unknown>
}

export interface AuditFlushResult {
  flushed: number
  failed: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUEUE_STORAGE_KEY = '__session_audit_queue__'
const SESSION_START_KEY = '__session_start_time__'
const SESSION_ID_KEY = '__session_id__'

function parseUserAgent(): { device: string; browser: string } {
  const ua = navigator.userAgent

  let device = 'Desktop'
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
    device = /iPad/i.test(ua) ? 'Tablet' : 'Mobile'
  }

  let browser = 'Unknown Browser'
  if (/Edg\//i.test(ua))
    browser = `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ''}`
  else if (/OPR\//i.test(ua))
    browser = `Opera ${ua.match(/OPR\/([\d.]+)/)?.[1] ?? ''}`
  else if (/Chrome\//i.test(ua))
    browser = `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ''}`
  else if (/Firefox\//i.test(ua))
    browser = `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? ''}`
  else if (/Safari\//i.test(ua))
    browser = `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? ''}`

  return { device, browser }
}

async function resolveClientIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    return data?.ip ?? null
  } catch {
    return null
  }
}

function now(): string {
  return new Date().toISOString()
}

function getSessionStartTime(): string | null {
  return (
    sessionStorage.getItem(SESSION_START_KEY) ||
    localStorage.getItem(SESSION_START_KEY) ||
    null
  )
}

function getSessionId(): string | null {
  return (
    sessionStorage.getItem(SESSION_ID_KEY) ||
    localStorage.getItem(SESSION_ID_KEY) ||
    Cookies.get(SESSION_ID_KEY) ||
    null
  )
}

function getUserId(): string | null {
  try {
    const raw =
      localStorage.getItem('user') ||
      localStorage.getItem('sessionUser') ||
      sessionStorage.getItem('user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.id ?? parsed?.userId ?? parsed?.sub ?? null
  } catch {
    return null
  }
}

function calculateDuration(loginTime: string | null): number | null {
  if (!loginTime) return null
  const diff = Date.now() - new Date(loginTime).getTime()
  return diff > 0 ? Math.floor(diff / 1000) : null
}

function enqueueLocally(entry: AuditLogEntry): void {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    const queue: AuditLogEntry[] = raw ? JSON.parse(raw) : []
    queue.push(entry)
    if (queue.length > 200) queue.splice(0, queue.length - 200)
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // localStorage may be unavailable; silently ignore
  }
}

function dequeueLocal(count: number): void {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!raw) return
    const queue: AuditLogEntry[] = JSON.parse(raw)
    queue.splice(0, count)
    if (queue.length === 0) {
      localStorage.removeItem(QUEUE_STORAGE_KEY)
    } else {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
    }
  } catch {
    // silent
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const SessionAuditService = {
  recordLoginTime(): void {
    const ts = now()
    try {
      sessionStorage.setItem(SESSION_START_KEY, ts)
      localStorage.setItem(SESSION_START_KEY, ts)
    } catch {
      // storage unavailable
    }
  },

  async log(
    reason: LogoutReason,
    logoutType: LogoutType,
    additionalContext?: Record<string, unknown>
  ): Promise<void> {
    const loginTime = getSessionStartTime()
    const logoutTime = now()
    const { device, browser } = parseUserAgent()

    const entry: AuditLogEntry = {
      userId: getUserId(),
      sessionId: getSessionId(),
      reason,
      logoutType,
      ipAddress: null,
      device,
      browser,
      loginTime,
      logoutTime,
      sessionDurationSeconds: calculateDuration(loginTime),
      timestamp: logoutTime,
      additionalContext,
    }

    resolveClientIp().then(async (ip) => {
      entry.ipAddress = ip
      await SessionAuditService._dispatch(entry)
    })
  },

  async _dispatch(entry: AuditLogEntry): Promise<void> {
    try {
      const token = Cookies.get('token') || localStorage.getItem('token')
      await axios.post('/api/audit/session-logout', entry, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
        timeout: 5000,
      })
    } catch {
      enqueueLocally(entry)
    }
  },

  async flushPendingEntries(): Promise<AuditFlushResult> {
    let flushed = 0
    let failed = 0

    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (!raw) return { flushed: 0, failed: 0 }

      const queue: AuditLogEntry[] = JSON.parse(raw)
      if (queue.length === 0) return { flushed: 0, failed: 0 }

      for (const entry of queue) {
        try {
          await SessionAuditService._dispatch(entry)
          flushed++
        } catch {
          failed++
        }
      }

      dequeueLocal(flushed)
    } catch {
      localStorage.removeItem(QUEUE_STORAGE_KEY)
    }

    return { flushed, failed }
  },
}

export default SessionAuditService
