import { useMemo } from 'react'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'

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

    const columns = [
        {
            Header: 'Date & Time',
            Cell: ({ row }: any) => (
                <span className="font-medium text-sm">{row.original.timestamp}</span>
            ),
        },
        {
            Header: 'Location',
            Cell: ({ row }: any) => (
                <span className="text-sm">{row.original.location}</span>
            ),
        },
        {
            Header: 'Device',
            Cell: ({ row }: any) => (
                <span className="text-sm">{row.original.device}</span>
            ),
        },
        {
            Header: 'Browser',
            Cell: ({ row }: any) => (
                <span className="text-sm">{row.original.browser}</span>
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
            Header: 'Status',
            Cell: ({ row }: any) => (
                <Badge
                    content={
                        row.original.status === 'success'
                            ? 'Successful'
                            : 'Failed'
                    }
                    badgeContent={row.original.status === 'success' ? '✓' : '✕'}
                    color={
                        row.original.status === 'success' ? 'success' : 'danger'
                    }
                />
            ),
        },
    ]

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Review all login attempts to your account
            </p>
            <Table columns={columns} data={loginData} />
        </div>
    )
}

export default LoginHistory
