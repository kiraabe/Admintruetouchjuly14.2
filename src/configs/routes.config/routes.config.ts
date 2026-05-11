import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/Home')),
        authority: [],
    },
    {
        key: 'dashboard',
        path: '/dashboard',
        component: lazy(() => import('@/views/Dashboard')),
        authority: [],
    },
    {
        key: 'users',
        path: '/users',
        component: lazy(() => import('@/views/Users')),
        authority: [],
    },
    {
        key: 'candidates',
        path: '/candidates',
        component: lazy(() => import('@/views/Candidates')),
        authority: [],
    },
    {
        key: 'editCandidate',
        path: '/candidates/edit/:id',
        component: lazy(() => import('@/views/EditCandidate')),
        authority: [],
    },
    {
        key: 'partnership',
        path: '/partnership',
        component: lazy(() => import('@/views/Partnership')),
        authority: [],
    },
    {
        key: 'editPartnership',
        path: '/partnership/edit/:id',
        component: lazy(() => import('@/views/EditPartnership')),
        authority: [],
    },
    {
        key: 'profile',
        path: '/profile',
        component: lazy(() => import('@/views/Profile')),
        authority: [],
    },
    {
        key: 'security',
        path: '/security',
        component: lazy(() => import('@/views/Security')),
        authority: [],
    },
    {
        key: 'employeeRequest',
        path: '/employee-request',
        component: lazy(() => import('@/views/EmployeeRequest')),
        authority: [],
    },
    {
        key: 'licenseInfo',
        path: '/license-info',
        component: lazy(() => import('@/views/LicenseInfo')),
        authority: [],
    },
    ...othersRoute,
]
