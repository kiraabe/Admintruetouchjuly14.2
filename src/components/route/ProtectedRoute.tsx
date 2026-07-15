import appConfig from '@/configs/app.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/auth'

const { unAuthenticatedEntryPath } = appConfig

const adminOnlyRoutes = [
    '/users',
    '/candidates',
    '/partnership/',
    '/job',
    '/blog',
    '/employee-request',
    '/license-info',
    '/setting',
    '/dashboard',
]

const ProtectedRoute = () => {
    const { authenticated, user } = useAuth()
    const userRole = user?.authority?.[0]

    const pathName = location.pathname

    const getPathName =
        pathName === '/' ? '' : `?${REDIRECT_URL_KEY}=${pathName}`

    if (!authenticated) {
        return (
            <Navigate
                replace
                to={`${unAuthenticatedEntryPath}${getPathName}`}
            />
        )
    }

    const isPartnershipUser =
        userRole === 'partnership' || userRole === 'partner'

    const isAdminOnlyRoute = adminOnlyRoutes.some(
        (route) => pathName === route || pathName.startsWith(route + '/')
    )

    if (isPartnershipUser && isAdminOnlyRoute) {
        return <Navigate replace to="/partnership-dashboard" />
    }

    return <Outlet />
}

export default ProtectedRoute
