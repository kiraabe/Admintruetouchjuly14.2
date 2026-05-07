import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
    NAV_ITEM_TYPE_COLLAPSE,
} from '@/constants/navigation.constant'

import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    {
        key: 'dashboard',
        path: '/dashboard',
        title: 'Dashboard',
        translateKey: 'nav.dashboard',
        icon: 'home',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'users',
        path: '/users',
        title: 'Users',
        translateKey: 'nav.users',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'candidates',
        path: '/candidates',
        title: 'Candidates',
        translateKey: 'nav.candidates',
        icon: 'collapseMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'partnership',
        path: '/partnership',
        title: 'Partnership',
        translateKey: 'nav.partnership',
        icon: 'groupMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'employeeRequest',
        path: '/employee-request',
        title: 'Employee Request',
        translateKey: 'nav.employeeRequest',
        icon: 'groupSingleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'licenseInfo',
        path: '/license-info',
        title: 'License Info',
        translateKey: 'nav.licenseInfo',
        icon: 'groupCollapseMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'setting',
        path: '/setting',
        title: 'Setting',
        translateKey: 'nav.setting',
        icon: 'groupMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
]

export default navigationConfig
