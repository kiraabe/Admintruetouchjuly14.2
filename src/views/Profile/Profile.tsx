import { useSessionUser } from '@/store/authStore'
import PageHeader from '@/components/template/PageHeader'
import ProfileForm from './components/ProfileForm'

const Profile = () => {
    const { avatar, userName, email, authority } = useSessionUser(
        (state) => state.user,
    )

    return (
        <>
            <PageHeader
                title="Profile"
                description="Manage your profile information"
            />
            <div className="gap-4 grid grid-cols-1 lg:grid-cols-3 mt-6">
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
                                            backgroundImage: avatar
                                                ? `url(${avatar})`
                                                : undefined,
                                            backgroundSize: 'cover',
                                        }}
                                    >
                                        {!avatar &&
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
                                    <p className="text-sm">
                                        {authority?.length > 0
                                            ? authority.join(', ')
                                            : 'User'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Profile
