import {
    SquaresPlusIcon,
    UsersIcon,
    UserGroupIcon,
    BriefcaseIcon,
    DocumentCheckIcon,
    Cog6ToothIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <SquaresPlusIcon className="w-6 h-6" />,
    singleMenu: <UsersIcon className="w-6 h-6" />,
    collapseMenu: <UserGroupIcon className="w-6 h-6" />,
    groupSingleMenu: <BuildingOfficeIcon className="w-6 h-6" />,
    groupCollapseMenu: <DocumentCheckIcon className="w-6 h-6" />,
    groupMenu: <Cog6ToothIcon className="w-6 h-6" />,
    briefcase: <BriefcaseIcon className="w-6 h-6" />,
}

export default navigationIcon
