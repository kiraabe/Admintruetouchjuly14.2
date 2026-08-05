import { useState, useEffect } from 'react'
import { useSessionUser } from '@/store/authStore'
import ProfileForm from './components/ProfileForm'
import ApiService from '@/services/ApiService'

const Profile = () => {
    const { avatar, userName, email, authority, partnershipId } = useSessionUser(
        (state) => state.user,
    )
    const isAdmin = authority?.some((role) => role.toLowerCase() === 'admin')
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
                            <div className="mb-6">
                                <h5 className="font-semibold">Profile Picture</h5>
                                <p className="mt-1 text-sm text-gray-500">
                                    Upload a professional image for your account.
                                </p>
                            </div>
                            <ProfileForm
                                data={{
                                    avatar: avatar || '',
                                    userName: userName || '',
                                    email: email || '',
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <div className="card">
                        <div className="card-body">
                            <h6 className="mb-4">Account Summary</h6>
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
                                    <h5 className="font-bold mb-1 truncate max-w-xs" title={partnershipName || userName || 'Anonymous'}>
                                        {partnershipName || userName || 'Anonymous'}
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
                                {!isAdmin && (
                                    <>
                                        <hr className="my-4" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                                                Partnership
                                            </p>
                                            <p className="text-sm font-semibold">
                                                {partnershipName || (partnershipId ? 'Loading...' : 'Not assigned')}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Profile
