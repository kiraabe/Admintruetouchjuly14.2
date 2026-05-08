import { useMemo } from 'react'
import Table from '@/components/ui/Table'
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

    const columns = [
        {
            Header: 'Action',
            Cell: ({ row }: any) => (
                <span className="font-medium">{row.original.action}</span>
            ),
        },
        {
            Header: 'Description',
            Cell: ({ row }: any) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {row.original.description}
                </span>
            ),
        },
        {
            Header: 'Date & Time',
            Cell: ({ row }: any) => (
                <span className="text-sm">{row.original.timestamp}</span>
            ),
        },
        {
            Header: 'IP Address',
            Cell: ({ row }: any) => (
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {row.original.ip}
                </code>
            ),
        },
        {
            Header: 'Device',
            Cell: ({ row }: any) => (
                <span className="text-sm">{row.original.device}</span>
            ),
        },
        {
            Header: 'Status',
            Cell: ({ row }: any) => (
                <Tag
                    variant={
                        row.original.status === 'success' ? 'solid' : 'plain'
                    }
                    color={
                        row.original.status === 'success' ? 'success' : 'danger'
                    }
                >
                    {row.original.status}
                </Tag>
            ),
        },
    ]

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                View all activities related to your account
            </p>
            <Table columns={columns} data={activityData} />
        </div>
    )
}

export default ActivityLogs
