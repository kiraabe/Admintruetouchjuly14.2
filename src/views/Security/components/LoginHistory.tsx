import { useMemo } from 'react'

interface LoginRecord {
    id: string
    timestamp: string
    location: string
    device: string
    browser: string
    ip: string
    status: 'success' | 'failed'
}

const LoginHistory = () => {
    const loginData: LoginRecord[] = useMemo(
        () => [
            {
                id: '1',
                timestamp: '2024-01-15 10:30:00',
                location: 'New York, US',
                device: 'Desktop',
                browser: 'Chrome 121.0',
                ip: '192.168.1.100',
                status: 'success',
            },
            {
                id: '2',
                timestamp: '2024-01-14 14:22:00',
                location: 'New York, US',
                device: 'Mobile',
                browser: 'Safari 17.0',
                ip: '192.168.1.101',
                status: 'success',
            },
            {
                id: '3',
                timestamp: '2024-01-13 09:15:00',
                location: 'San Francisco, US',
                device: 'Desktop',
                browser: 'Firefox 121.0',
                ip: '203.0.113.42',
                status: 'success',
            },
            {
                id: '4',
                timestamp: '2024-01-12 16:45:00',
                location: 'Unknown',
                device: 'Desktop',
                browser: 'Chrome 121.0',
                ip: '203.0.113.50',
                status: 'failed',
            },
            {
                id: '5',
                timestamp: '2024-01-11 11:20:00',
                location: 'New York, US',
                device: 'Desktop',
                browser: 'Chrome 120.0',
                ip: '192.168.1.100',
                status: 'success',
            },
        ],
        [],
    )

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Review all login attempts to your account
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-semibold">
                                Date & Time
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                Location
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                Device
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                Browser
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                IP Address
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loginData.map((login) => (
                            <tr
                                key={login.id}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                                <td className="py-3 px-4 font-medium">
                                    {login.timestamp}
                                </td>
                                <td className="py-3 px-4">{login.location}</td>
                                <td className="py-3 px-4">{login.device}</td>
                                <td className="py-3 px-4">{login.browser}</td>
                                <td className="py-3 px-4">
                                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {login.ip}
                                    </code>
                                </td>
                                <td className="py-3 px-4">
                                    <span
                                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                            login.status === 'success'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                        }`}
                                    >
                                        {login.status === 'success'
                                            ? 'Successful'
                                            : 'Failed'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default LoginHistory
