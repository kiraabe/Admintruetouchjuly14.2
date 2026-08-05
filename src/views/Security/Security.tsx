import { useState } from 'react'
import Tabs from '@/components/ui/Tabs'
import { useSessionUser } from '@/store/authStore'
import PasswordSecurity from './components/PasswordSecurity'

type SecurityTab = 'password' | 'activity' | 'login' | 'roles' | 'sessions'

const ComingSoon = () => (
    <div className="flex items-center justify-center py-12">
        <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">Coming Soon</p>
            <p className="text-sm text-gray-500 mt-2">
                This feature will be available soon.
            </p>
        </div>
    </div>
)

const Security = () => {
    const [activeTab, setActiveTab] = useState<SecurityTab>('password')
    const userRole = useSessionUser((state) => state.user.authority?.[0])
    const isPartnershipUser = userRole === 'partnership' || userRole === 'partner'

    const tabs = [
        {
            value: 'password',
            label: 'Password Security',
            component: <PasswordSecurity />,
        },
        {
            value: 'activity',
            label: 'Activity Logs',
            component: <ComingSoon />,
        },
        {
            value: 'login',
            label: 'Login History',
            component: <ComingSoon />,
        },
        {
            value: 'roles',
            label: 'Roles & Permissions',
            component: <ComingSoon />,
        },
        {
            value: 'sessions',
            label: 'Active Sessions',
            component: <ComingSoon />,
        },
    ].filter((tab) => !isPartnershipUser || tab.value === 'password')

    return (
        <div>
            <div className="mb-6">
                <h3 className="font-bold">Security Settings</h3>
                <p className="text-sm text-gray-500">
                    Manage your account security and access controls
                </p>
            </div>

            <div className="card">
                <div className="card-body">
                    <Tabs
                        value={activeTab}
                        onChange={(val) => setActiveTab(val as SecurityTab)}
                        defaultValue="password"
                    >
                        <Tabs.TabList>
                            {tabs.map((tab) => (
                                <Tabs.TabNav
                                    key={tab.value}
                                    value={tab.value}
                                >
                                    {tab.label}
                                </Tabs.TabNav>
                            ))}
                        </Tabs.TabList>
                        {tabs.map((tab) => (
                            <Tabs.TabContent
                                key={tab.value}
                                value={tab.value}
                            >
                                {tab.component}
                            </Tabs.TabContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

export default Security
