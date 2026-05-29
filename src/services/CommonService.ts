import ApiService from './ApiService'
import { useSessionUser } from '@/store/authStore'

export async function apiGetNotificationCount() {
    const { user } = useSessionUser.getState()

    if (!user.userId) {
        console.warn('User ID not available for notification count')
        return { count: 0 }
    }

    return ApiService.fetchDataWithAxios<{
        count: number
    }>({
        url: '/notification/count',
        method: 'get',
        params: {
            user_id: user.userId
        }
    })
}

export async function apiGetNotificationList() {
    const { user } = useSessionUser.getState()

    if (!user.userId) {
        console.warn('User ID not available for notification list')
        return []
    }

    return ApiService.fetchDataWithAxios<
        {
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
        }[]
    >({
        url: '/notification/list',
        method: 'get',
        params: {
            user_id: user.userId
        }
    })
}

export async function apiGetSearchResult<T>(params: { query: string }) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/search/query',
        method: 'get',
        params,
    })
}

export async function apiCreateNotification(data: {
    target: string
    description: string
    type: number
    location: string
    locationLabel: string
    status: string
    user_id?: string
    related_entity_id?: string
    related_entity_type?: string
    image_url?: string
}) {
    return ApiService.fetchDataWithAxios({
        url: '/notification/create',
        method: 'post',
        data,
    })
}

export async function apiMarkNotificationAsRead(notificationId: string) {
    return ApiService.fetchDataWithAxios({
        url: `/mark-read/${notificationId}`,
        method: 'put'
    })
}

export async function apiMarkAllNotificationsAsRead() {
    return ApiService.fetchDataWithAxios({
        url: '/mark-all-read',
        method: 'put'
    })
}
