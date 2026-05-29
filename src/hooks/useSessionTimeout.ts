import { useEffect, useRef, useState } from 'react'
import SessionService from '@/services/SessionService'

export const useSessionTimeout = () => {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  const handleActivity = () => {
    if (showWarning) return // Don't reset if warning is showing

    setShowWarning(false)
    if (countdownRef.current) clearInterval(countdownRef.current)
    SessionService.resetInactivityTimer()
  }

  const handleExtendSession = async () => {
    const extended = await SessionService.extendSession()
    if (extended) {
      setShowWarning(false)
    }
  }

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // Set up callbacks
    SessionService.setCallbacks({
      onWarning: () => {
        setShowWarning(true)
        // Start countdown from 2 minutes
        let remaining = 120
        setTimeLeft(remaining)
        if (countdownRef.current) clearInterval(countdownRef.current)
        countdownRef.current = setInterval(() => {
          remaining--
          setTimeLeft(remaining)
          if (remaining <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current)
          }
        }, 1000)
      },
      onExpire: () => {
        setShowWarning(false)
      },
    })

    // Initialize timer
    SessionService.resetInactivityTimer()

    // Activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    const listener = () => handleActivity()

    events.forEach((event) => {
      document.addEventListener(event, listener, true)
    })

    // Cleanup on unmount
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, listener, true)
      })
      SessionService.clearTimers()
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  return { showWarning, timeLeft, handleExtendSession }
}
