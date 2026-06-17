import { useEffect, useRef, useState } from 'react'
import SessionService from '@/services/SessionService'
import { LogoutReason, LogoutType } from '@/services/SessionAuditService'

export const useSessionTimeout = () => {
  const [showWarning, setShowWarning]   = useState(false)
  const [timeLeft,    setTimeLeft]      = useState(0)
  const countdownRef                    = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef                = useRef(false)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const stopCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  const startCountdown = (fromSeconds: number) => {
    stopCountdown()
    let remaining = fromSeconds
    setTimeLeft(remaining)

    countdownRef.current = setInterval(() => {
      remaining--
      setTimeLeft(remaining)
      if (remaining <= 0) stopCountdown()
    }, 1000)
  }

  // ── Activity reset (suppressed while warning modal is open) ───────────────

  const handleActivity = () => {
    if (showWarning) return
    stopCountdown()
    setShowWarning(false)
    SessionService.resetInactivityTimer()
  }

  // ── Extend session (Continue button in the warning modal) ─────────────────

  const handleExtendSession = async () => {
    const extended = await SessionService.extendSession()
    if (extended) {
      stopCountdown()
      setShowWarning(false)
    }
    // On failure, extendSession calls expireSession internally with an audit
    // log entry — no extra handling needed here.
  }

  // ── Manual logout ─────────────────────────────────────────────────────────

  const handleLogout = () => {
    SessionService.logout()
  }

  // ── Storage-integrity check ───────────────────────────────────────────────

  /**
   * Validate that critical storage keys exist. Call from route guard or on
   * authenticated page mount. Returns false and expires the session if invalid.
   */
  const validateSession = (): boolean => {
    return SessionService.validateClientSession()
  }

  // ── Convenience: force-expire with a specific reason ──────────────────────

  const forceExpire = (reason: LogoutReason, context?: Record<string, unknown>) => {
    SessionService.forceLogout(reason, context)
  }

  // ── Route guard helper ─────────────────────────────────────────────────────

  const handleRouteGuardFailure = () => {
    SessionService.expireSession(LogoutReason.ROUTE_GUARD_FAILURE, LogoutType.AUTOMATIC)
  }

  const handleAuthGuardFailure = () => {
    SessionService.expireSession(LogoutReason.AUTH_GUARD_FAILURE, LogoutType.AUTOMATIC)
  }

  // ── Initialise once ───────────────────────────────────────────────────────

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // 1. Wire up SessionService callbacks
    SessionService.setCallbacks({
      onWarning: () => {
        setShowWarning(true)
        startCountdown(120) // 2-minute visual countdown
      },
      onExpire: () => {
        stopCountdown()
        setShowWarning(false)
      },
    })

    // 2. Register global interceptors
    SessionService.registerAxiosInterceptor()
    SessionService.registerStorageListener()

    // 3. Start timers
    SessionService.resetInactivityTimer()
    SessionService.startAbsoluteTimer()

    // 4. User-activity listeners
    const events: string[] = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    const listener = () => handleActivity()
    events.forEach((ev) => document.addEventListener(ev, listener, true))

    // 5. visibilitychange: re-validate session on tab focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        SessionService.validateClientSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 6. beforeunload: detect private-browsing closure (best-effort)
    const handleUnload = () => {
      // sessionStorage is cleared automatically on private-session close;
      // we only need to note the unload for private-browsing detection edge cases.
      // Nothing to do here — the storage listener handles the next-load case.
    }
    window.addEventListener('beforeunload', handleUnload)

    // Cleanup on unmount
    return () => {
      events.forEach((ev) => document.removeEventListener(ev, listener, true))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleUnload)
      SessionService.clearTimers()
      stopCountdown()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    showWarning,
    timeLeft,
    handleExtendSession,
    handleLogout,
    validateSession,
    forceExpire,
    handleRouteGuardFailure,
    handleAuthGuardFailure,
  }
}