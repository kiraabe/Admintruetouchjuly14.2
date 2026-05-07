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
        key: 'partnership',
        path: '/partnership',
        component: lazy(() => import('@/views/Partnership')),
        authority: [],
    },
    ...othersRoute,
]
