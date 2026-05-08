import { useState } from 'react'
import Tabs from '@/components/ui/Tabs'
import ActivityLogs from './components/ActivityLogs'
import LoginHistory from './components/LoginHistory'
import RolePermissions from './components/RolePermissions'
import PasswordSecurity from './components/PasswordSecurity'
import TwoFactorAuth from './components/TwoFactorAuth'
import Sessions from './components/Sessions'

type SecurityTab = 'activity' | 'login' | 'roles' | 'password' | 'twofa' | 'sessions'

const Security = () => {
    const [activeTab, setActiveTab] = useState<SecurityTab>('activity')

    const tabs = [
        {
            value: 'activity',
            label: 'Activity Logs',
            component: <ActivityLogs />,
        },
        {
            value: 'login',
            label: 'Login History',
            component: <LoginHistory />,
        },
        {
            value: 'roles',
            label: 'Roles & Permissions',
            component: <RolePermissions />,
        },
        {
            value: 'password',
            label: 'Password Security',
            component: <PasswordSecurity />,
        },
        {
            value: 'twofa',
            label: 'Two-Factor Auth',
            component: <TwoFactorAuth />,
        },
        {
            value: 'sessions',
            label: 'Active Sessions',
            component: <Sessions />,
        },
    ]

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
                        defaultValue="activity"
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
