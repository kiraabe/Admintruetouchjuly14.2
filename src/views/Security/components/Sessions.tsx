import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

interface Session {
    id: string
    device: string
    browser: string
    location: string
    ip: string
    lastActive: string
    isCurrent: boolean
}

const Sessions = () => {
    const [sessions, setSessions] = useState<Session[]>([
        {
            id: '1',
            device: 'Desktop',
            browser: 'Chrome 121.0',
            location: 'New York, US',
            ip: '192.168.1.100',
            lastActive: 'Active now',
            isCurrent: true,
        },
        {
            id: '2',
            device: 'Mobile',
            browser: 'Safari 17.0',
            location: 'New York, US',
            ip: '192.168.1.101',
            lastActive: '2 hours ago',
            isCurrent: false,
        },
        {
            id: '3',
            device: 'Laptop',
            browser: 'Firefox 121.0',
            location: 'San Francisco, US',
            ip: '203.0.113.42',
            lastActive: '1 day ago',
            isCurrent: false,
        },
    ])

    const [loading, setLoading] = useState<string | null>(null)

    const handleRevokeSession = async (sessionId: string) => {
        setLoading(sessionId)
        try {
            await new Promise((resolve) => setTimeout(resolve, 800))
            setSessions((prev) => prev.filter((s) => s.id !== sessionId))
            alert('Session has been revoked')
        } finally {
            setLoading(null)
        }
    }

    const handleRevokeAllOthers = async () => {
        if (
            window.confirm(
                'This will sign you out from all other devices. Continue?',
            )
        ) {
            setLoading('all')
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                setSessions((prev) => prev.filter((s) => s.isCurrent))
                alert('All other sessions have been revoked')
            } finally {
                setLoading(null)
            }
        }
    }

    return (
        <div className="space-y-6">
            <Alert type="info">
                Manage devices and sessions where your account is signed in
            </Alert>

            <div className="flex justify-end mb-4">
                <Button
                    variant="outline"
                    color="danger"
                    size="sm"
                    onClick={handleRevokeAllOthers}
                    loading={loading === 'all'}
                    disabled={loading !== null}
                >
                    Sign Out All Other Sessions
                </Button>
            </div>

            <div className="space-y-4">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={`border rounded-lg p-4 ${
                            session.isCurrent
                                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h6 className="font-semibold">
                                        {session.device}
                                    </h6>
                                    {session.isCurrent && (
                                        <span className="px-2 py-1 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100 text-xs rounded-full">
                                            Current Session
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <p>
                                        <span className="font-medium">
                                            Browser:
                                        </span>{' '}
                                        {session.browser}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Location:
                                        </span>{' '}
                                        {session.location}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            IP Address:
                                        </span>{' '}
                                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                            {session.ip}
                                        </code>
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Last Active:
                                        </span>{' '}
                                        {session.lastActive}
                                    </p>
                                </div>
                            </div>

                            {!session.isCurrent && (
                                <Button
                                    variant="plain"
                                    color="danger"
                                    size="sm"
                                    loading={loading === session.id}
                                    disabled={loading !== null}
                                    onClick={() => handleRevokeSession(session.id)}
                                >
                                    Revoke
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {sessions.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No active sessions</p>
                </div>
            )}
        </div>
    )
}

export default Sessions
