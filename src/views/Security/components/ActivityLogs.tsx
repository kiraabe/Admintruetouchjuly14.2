import { useMemo } from 'react'
import Tag from '@/components/ui/Tag'

interface ActivityLog {
    id: string
    action: string
    description: string
    timestamp: string
    ip: string
    device: string
    status: 'success' | 'failed'
}

const ActivityLogs = () => {
    const activityData: ActivityLog[] = useMemo(
        () => [
            {
                id: '1',
                action: 'Login',
                description: 'User logged in successfully',
                timestamp: '2024-01-15 10:30:00',
                ip: '192.168.1.100',
                device: 'Chrome on Windows',
                status: 'success',
            },
            {
                id: '2',
                action: 'Profile Update',
                description: 'Profile information updated',
                timestamp: '2024-01-14 14:22:00',
                ip: '192.168.1.100',
                device: 'Chrome on Windows',
                status: 'success',
            },
            {
                id: '3',
                action: 'Password Change',
                description: 'Password changed successfully',
                timestamp: '2024-01-13 09:15:00',
                ip: '192.168.1.100',
                device: 'Safari on macOS',
                status: 'success',
            },
            {
                id: '4',
                action: 'Failed Login',
                description: 'Login attempt failed - incorrect password',
                timestamp: '2024-01-12 16:45:00',
                ip: '203.0.113.50',
                device: 'Firefox on Windows',
                status: 'failed',
            },
            {
                id: '5',
                action: 'Permission Change',
                description: 'Permissions updated by admin',
                timestamp: '2024-01-11 11:20:00',
                ip: '192.168.1.100',
                device: 'Chrome on Windows',
                status: 'success',
            },
        ],
        [],
    )

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                View all activities related to your account
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-semibold">
                                Action
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                Description
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                Date & Time
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                IP Address
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                Device
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {activityData.map((log) => (
                            <tr
                                key={log.id}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                                <td className="py-3 px-4 font-medium">
                                    {log.action}
                                </td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                    {log.description}
                                </td>
                                <td className="py-3 px-4">{log.timestamp}</td>
                                <td className="py-3 px-4">
                                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {log.ip}
                                    </code>
                                </td>
                                <td className="py-3 px-4">{log.device}</td>
                                <td className="py-3 px-4">
                                    <Tag
                                        variant={
                                            log.status === 'success'
                                                ? 'solid'
                                                : 'plain'
                                        }
                                        color={
                                            log.status === 'success'
                                                ? 'success'
                                                : 'danger'
                                        }
                                    >
                                        {log.status}
                                    </Tag>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ActivityLogs
