import { useEffect, useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import SessionAuditService, {
  AuditLogEntry,
  LogoutReason,
  LogoutType,
} from '@/services/SessionAuditService'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'

const formatLogoutReason = (reason: LogoutReason): string => {
  return reason
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

const getLogoutTypeBadgeClass = (logoutType: LogoutType): string => {
  switch (logoutType) {
    case LogoutType.MANUAL:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case LogoutType.AUTOMATIC:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case LogoutType.FORCED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case LogoutType.PREVENTIVE:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const formatDuration = (seconds: number | null): string => {
  if (seconds === null) return '—'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString)
    return date.toLocaleString()
  } catch {
    return isoString
  }
}

const SessionAudit = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        await SessionAuditService.flushPendingEntries()

        const token = Cookies.get('token') || localStorage.getItem('token')
        const response = await axios.get('/api/audit/session-logout', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
        })

        if (response.data && Array.isArray(response.data)) {
          setEntries(response.data)
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          setEntries(response.data.data)
        }
        setError(null)
      } catch (err) {
        console.error('Failed to fetch audit logs:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch session audit logs'
        )
        setEntries([])
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLogs()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg">Session Audit Log</h3>
        <p className="text-sm text-gray-500 mt-1">
          View the history of session logouts and audit events
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {loading ? (
        <Card>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
          </div>
        </Card>
      ) : entries.length === 0 ? (
        <Alert type="info">No session audit logs available yet.</Alert>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    User ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    Session ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    Logout Reason
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    IP Address
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    Device
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    Browser
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    Login Time
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    Logout Time
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {entry.userId ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {entry.sessionId ? entry.sessionId.substring(0, 8) + '...' : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatLogoutReason(entry.reason)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getLogoutTypeBadgeClass(
                          entry.logoutType
                        )}`}
                      >
                        {entry.logoutType.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {entry.ipAddress ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {entry.device}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                      {entry.browser}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                      {entry.loginTime ? formatDateTime(entry.loginTime) : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                      {formatDateTime(entry.logoutTime)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatDuration(entry.sessionDurationSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SessionAudit
