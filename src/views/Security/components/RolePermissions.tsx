import { useMemo, useState } from 'react'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import { useSessionUser } from '@/store/authStore'

interface Permission {
    id: string
    name: string
    description: string
}

interface Role {
    id: string
    name: string
    permissions: Permission[]
}

const RolePermissions = () => {
    const { authority } = useSessionUser((state) => state.user)
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    const allRoles: Role[] = useMemo(
        () => [
            {
                id: 'admin',
                name: 'Administrator',
                permissions: [
                    {
                        id: 'manage_users',
                        name: 'Manage Users',
                        description: 'Create, edit, and delete users',
                    },
                    {
                        id: 'manage_roles',
                        name: 'Manage Roles',
                        description: 'Assign and modify user roles',
                    },
                    {
                        id: 'view_reports',
                        name: 'View Reports',
                        description: 'Access all analytics and reports',
                    },
                    {
                        id: 'manage_settings',
                        name: 'Manage Settings',
                        description: 'Configure system-wide settings',
                    },
                    {
                        id: 'manage_security',
                        name: 'Manage Security',
                        description: 'Configure security policies',
                    },
                ],
            },
            {
                id: 'manager',
                name: 'Manager',
                permissions: [
                    {
                        id: 'view_team',
                        name: 'View Team',
                        description: 'View team members and their activities',
                    },
                    {
                        id: 'manage_team',
                        name: 'Manage Team',
                        description: 'Edit team member details',
                    },
                    {
                        id: 'view_reports',
                        name: 'View Reports',
                        description: 'Access team reports',
                    },
                    {
                        id: 'approve_requests',
                        name: 'Approve Requests',
                        description: 'Approve team requests and changes',
                    },
                ],
            },
            {
                id: 'user',
                name: 'User',
                permissions: [
                    {
                        id: 'view_profile',
                        name: 'View Profile',
                        description: 'Access personal profile',
                    },
                    {
                        id: 'edit_profile',
                        name: 'Edit Profile',
                        description: 'Update personal information',
                    },
                    {
                        id: 'view_own_reports',
                        name: 'View Own Reports',
                        description: 'Access personal reports',
                    },
                ],
            },
        ],
        [],
    )

    const handlePermissionChange = (permissionId: string) => {
        setSelectedPermissions((prev) =>
            prev.includes(permissionId)
                ? prev.filter((p) => p !== permissionId)
                : [...prev, permissionId],
        )
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            alert('Permissions saved successfully')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h6 className="font-semibold mb-2">Current Roles</h6>
                <div className="flex gap-2">
                    {authority && authority.length > 0 ? (
                        authority.map((role) => (
                            <span
                                key={role}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-sm rounded-full"
                            >
                                {role}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-gray-500">
                            No roles assigned
                        </span>
                    )}
                </div>
            </div>

            <div>
                <h6 className="font-semibold mb-4">Available Permissions</h6>
                <div className="space-y-4">
                    {allRoles.map((role) => (
                        <div
                            key={role.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                            <h5 className="font-semibold mb-3">{role.name}</h5>
                            <div className="space-y-3">
                                {role.permissions.map((permission) => (
                                    <div
                                        key={permission.id}
                                        className="flex items-start gap-3"
                                    >
                                        <Checkbox
                                            checked={selectedPermissions.includes(
                                                permission.id,
                                            )}
                                            onChange={() =>
                                                handlePermissionChange(
                                                    permission.id,
                                                )
                                            }
                                        />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {permission.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {permission.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    variant="solid"
                    loading={saving}
                    disabled={saving}
                    onClick={handleSave}
                >
                    Save Permissions
                </Button>
            </div>
        </div>
    )
}

export default RolePermissions
