import { useEffect, useState, useRef, useCallback } from 'react'
import classNames from 'classnames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Dropdown from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NotificationAvatar from './NotificationAvatar'
import NotificationToggle from './NotificationToggle'
import { HiOutlineMailOpen, HiOutlineTrash, HiCheck } from 'react-icons/hi'
import { toast } from 'sonner'
import {
    apiGetNotificationList,
    apiGetNotificationCount,
    apiMarkNotificationAsRead,
    apiMarkAllNotificationsAsRead,
    apiClearAllNotifications,
    apiDeleteNotification,
} from '@/services/CommonService'
import isLastChild from '@/utils/isLastChild'
import useResponsive from '@/utils/hooks/useResponsive'
import { useNavigate } from 'react-router'

import type { DropdownRef } from '@/components/ui/Dropdown'

type NotificationList = {
    id: string
    target: string
    description: string
    date: string
    image: string
    type: number
    location: string
    locationLabel: string
    status: string
    readed: boolean
}

const notificationHeight = 'h-[280px]'

const _Notification = ({ className }: { className?: string }) => {
    const [notificationList, setNotificationList] = useState<
        NotificationList[]
    >([])
    const [unreadNotification, setUnreadNotification] = useState(false)
    const [noResult, setNoResult] = useState(false)
    const [loading, setLoading] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const notificationLoadId = useRef(0)
    const isDropdownOpen = useRef(false)

    const { larger } = useResponsive()

    const navigate = useNavigate()

    const getNotificationCount = useCallback(async () => {
        try {
            const resp = await apiGetNotificationCount()
            setUnreadCount(resp.count)
            setUnreadNotification(resp.count > 0)
            if (resp.count > 0) {
                setNoResult(false)
            }
        } catch (error) {
            console.error('Error fetching notification count:', error)
        }
    }, [])

    const loadNotifications = useCallback(async () => {
        const loadId = ++notificationLoadId.current
        setLoading(true)
        try {
            const resp = await apiGetNotificationList()
            if (loadId !== notificationLoadId.current) return
            setNotificationList(resp)
            setNoResult(resp.length === 0)
        } catch (error) {
            if (loadId !== notificationLoadId.current) return
            console.error('Error fetching notifications:', error)
            setNotificationList([])
            setNoResult(true)
        } finally {
            if (loadId === notificationLoadId.current) {
                setLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        const refreshNotifications = () => {
            getNotificationCount()
            if (isDropdownOpen.current) {
                loadNotifications()
            }
        }

        refreshNotifications()
        const events = new EventSource('/api/contact-us/events')
        const interval = window.setInterval(refreshNotifications, 5000)
        events.addEventListener('contact-message-created', refreshNotifications)
        events.onerror = () => events.close()

        return () => {
            window.clearInterval(interval)
            events.removeEventListener('contact-message-created', refreshNotifications)
            events.close()
        }
    }, [getNotificationCount, loadNotifications])

    const onNotificationOpen = (open: boolean) => {
        isDropdownOpen.current = open
        if (open) {
            getNotificationCount()
            loadNotifications()
        }
    }

    const onMarkAllAsRead = async () => {
        try {
            await apiMarkAllNotificationsAsRead()
            const list = notificationList.map((item: NotificationList) => ({
                ...item,
                readed: true,
            }))
            setNotificationList(list)
            setUnreadNotification(false)
            setUnreadCount(0)
            toast.success('All notifications marked as read')
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
            toast.error('Failed to mark all as read')
        }
    }

    const onMarkAsRead = async (id: string) => {
        try {
            await apiMarkNotificationAsRead(id)
            const list = notificationList.map((item) =>
                item.id === id ? { ...item, readed: true } : item,
            )
            setNotificationList(list)
            const unread = list.filter((item) => !item.readed).length
            setUnreadCount(unread)

            if (unread === 0) {
                setUnreadNotification(false)
            }
            toast.success('Marked as read')
        } catch (error) {
            console.error('Error marking notification as read:', error)
            toast.error('Failed to mark as read')
        }
    }

    const onClearNotifications = async () => {
        notificationLoadId.current += 1
        try {
            const notificationsToDelete = [...notificationList]
            await apiClearAllNotifications()

            await Promise.allSettled(
                notificationsToDelete.map((item) => apiDeleteNotification(item.id)),
            )

            setNotificationList([])
            setUnreadNotification(false)
            setUnreadCount(0)
            setNoResult(true)
            toast.success('All notifications cleared')
        } catch (error) {
            console.error('Error clearing notifications:', error)
            toast.error('Failed to clear notifications')
        }
    }

    const onDeleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await apiDeleteNotification(id)
            const list = notificationList.filter((item) => item.id !== id)
            setNotificationList(list)
            const unread = list.filter((item) => !item.readed).length
            setUnreadCount(unread)
            if (unread === 0) {
                setUnreadNotification(false)
            }
            if (list.length === 0) {
                setNoResult(true)
            }
            toast.success('Notification deleted')
        } catch (error) {
            console.error('Error deleting notification:', error)
            toast.error('Failed to delete notification')
        }
    }

    const notificationDropdownRef = useRef<DropdownRef>(null)

    const handleViewAllActivity = () => {
        navigate('/concepts/account/activity-log')
        if (notificationDropdownRef.current) {
            notificationDropdownRef.current.handleDropdownClose()
        }
    }

    return (
        <Dropdown
            ref={notificationDropdownRef}
            renderTitle={
                <NotificationToggle
                    dot={unreadNotification}
                    count={unreadCount}
                    className={className}
                />
            }
            menuClass="min-w-[280px] md:min-w-[340px]"
            placement={larger.md ? 'bottom-end' : 'bottom'}
            onOpen={onNotificationOpen}
        >
            <Dropdown.Item variant="header">
                <div className="dark:border-gray-700 px-2 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                        <h6>Notifications</h6>
                        {unreadCount > 0 && (
                            <Badge className="ml-1 text-xs">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="plain"
                            shape="circle"
                            size="sm"
                            icon={<HiOutlineMailOpen className="text-xl" />}
                            title="Mark all as read"
                            onClick={onMarkAllAsRead}
                        />
                        <Button
                            variant="plain"
                            shape="circle"
                            size="sm"
                            icon={<HiOutlineTrash className="text-xl" />}
                            title="Clear all"
                            onClick={(e) => {
                                e.stopPropagation()
                                onClearNotifications()
                            }}
                        />
                    </div>
                </div>
            </Dropdown.Item>
            <ScrollBar
                className={classNames('overflow-y-auto', notificationHeight)}
            >
                {notificationList.length > 0 &&
                    notificationList.map((item, index) => (
                        <div key={item.id}>
                            <div
                                className={`relative rounded-xl flex px-4 py-3 cursor-pointer hover:bg-gray-100 active:bg-gray-100 dark:hover:bg-gray-700 group ${!item.readed ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                onClick={() => onMarkAsRead(item.id)}
                            >
                                <div>
                                    <NotificationAvatar {...item} />
                                </div>
                                <div className="mx-3 flex-1">
                                    <div>
                                        {item.target && (
                                            <span className="font-semibold heading-text">
                                                {item.target}{' '}
                                            </span>
                                        )}
                                        <span>{item.description}</span>
                                    </div>
                                    <span className="text-xs">{item.date}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge
                                        className="mt-1.5"
                                        innerClass={`${
                                            item.readed
                                                ? 'bg-gray-300 dark:bg-gray-600'
                                                : 'bg-primary'
                                        } `}
                                    />
                                    {!item.readed && (
                                        <Button
                                            variant="plain"
                                            shape="circle"
                                            size="sm"
                                            icon={<HiCheck className="text-lg" />}
                                            title="Mark as read"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onMarkAsRead(item.id)
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        />
                                    )}
                                    <Button
                                        variant="plain"
                                        shape="circle"
                                        size="sm"
                                        icon={<HiOutlineTrash className="text-lg" />}
                                        title="Delete notification"
                                        onClick={(e) => onDeleteNotification(item.id, e)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            </div>
                            {!isLastChild(notificationList, index) ? (
                                <div className="border-b border-gray-200 dark:border-gray-700 my-2" />
                            ) : (
                                ''
                            )}
                        </div>
                    ))}
                {loading && (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight,
                        )}
                    >
                        <Spinner size={40} />
                    </div>
                )}
                {noResult && notificationList.length === 0 && (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight,
                        )}
                    >
                        <div className="text-center">
                            <img
                                className="mx-auto mb-2 max-w-[150px]"
                                src="/img/others/no-notification.png"
                                alt="no-notification"
                            />
                            <h6 className="font-semibold">No notifications!</h6>
                            <p className="mt-1">Please Try again later</p>
                        </div>
                    </div>
                )}
            </ScrollBar>
            <Dropdown.Item variant="header">
                <div className="pt-4">
                    <Button
                        block
                        variant="solid"
                        onClick={handleViewAllActivity}
                    >
                        View All Activity
                    </Button>
                </div>
            </Dropdown.Item>
        </Dropdown>
    )
}

const Notification = withHeaderItem(_Notification)

export default Notification
