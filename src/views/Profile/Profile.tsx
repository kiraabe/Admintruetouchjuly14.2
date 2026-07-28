import { useState, useEffect } from 'react'
import { useSessionUser } from '@/store/authStore'
import ProfileForm from './components/ProfileForm'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { notify } from '@/utils/notification'
import ApiService from '@/services/ApiService'

const Profile = () => {
    const { avatar, userName, email, authority, partnershipId } = useSessionUser(
        (state) => state.user,
    )
    const setUser = useSessionUser((state) => state.setUser)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [partnershipName, setPartnershipName] = useState<string>('')
    const [partnershipLogo, setPartnershipLogo] = useState<string>('')

    useEffect(() => {
        if (partnershipId) {
            ApiService.fetchDataWithAxios<any>({
                method: 'GET',
                url: `/partnerships/${partnershipId}`,
            })
                .then((data) => {
                    if (data.success && data.data) {
                        setPartnershipName(data.data.company_name || '')
                        setPartnershipLogo(data.data.company_logo || '')
                    }
                })
                .catch((err) => console.error('Failed to fetch partnership:', err))
        }
    }, [partnershipId])

    const generatePassword = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
        let password = ''
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
    }

    const handleGeneratePassword = () => {
        const generated = generatePassword()
        setNewPassword(generated)
        setConfirmPassword(generated)
    }

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            notify.error('Error', 'Password fields are required')
            return
        }

        if (newPassword !== confirmPassword) {
            notify.error('Error', 'Passwords do not match')
            return
        }

        try {
            const token = localStorage.getItem('authToken')
            const response = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ password: newPassword }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to change password')
            }

            notify.success('Success', 'Password changed successfully')
            setShowPasswordModal(false)
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to change password'
            notify.error('Error', errorMsg)
        }
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="font-bold">Profile</h3>
                <p className="text-sm text-gray-500">
                    Manage your profile information
                </p>
            </div>
            <div className="gap-4 grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="card-body">
                            <h6 className="mb-4">Personal Information</h6>
                            <ProfileForm
                                data={{
                                    avatar: avatar || '',
                                    userName: userName || '',
                                    email: email || '',
                                }}
                                onAvatarChange={(nextAvatar) => setUser({ avatar: nextAvatar })}
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <div className="card">
                        <div className="card-body">
                            <h6 className="mb-4">Profile Summary</h6>
                            <div className="space-y-4">
                                <div className="flex flex-col items-center text-center">
                                    <div
                                        className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-4"
                                        style={{
                                            backgroundImage: (avatar || partnershipLogo)
                                                ? `url(${avatar || partnershipLogo})`
                                                : undefined,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    >
                                        {!(avatar || partnershipLogo) &&
                                            userName
                                                ?.charAt(0)
                                                .toUpperCase()}
                                    </div>
                                    <h5 className="font-bold mb-1">
                                        {userName || 'Anonymous'}
                                    </h5>
                                    <p className="text-sm text-gray-500">
                                        {email || 'No email'}
                                    </p>
                                </div>
                                <hr className="my-4" />
                                <div>
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                                        Role
                                    </p>
                                    <p className="text-sm font-semibold capitalize">
                                        {authority?.length > 0
                                            ? authority[0]
                                            : 'User'}
                                    </p>
                                </div>
                                <hr className="my-4" />
                                <div>
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                                        Partnership
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {partnershipName || (partnershipId ? 'Loading...' : 'Not assigned')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card mt-4">
                        <div className="card-body">
                            <h6 className="mb-4">Security</h6>
                            <Button
                                variant="primary"
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full"
                            >
                                Change Password
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-md">
                        <div className="card-body p-6">
                            <h3 className="text-lg font-bold mb-4">Change Password</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="form-label">New Password</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                        />
                                        <Button
                                            variant="default"
                                            onClick={handleGeneratePassword}
                                            title="Generate password"
                                        >
                                            Generate
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Confirm Password</label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        setShowPasswordModal(false)
                                        setNewPassword('')
                                        setConfirmPassword('')
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleChangePassword}
                                    className="flex-1"
                                >
                                    Change Password
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Profile
