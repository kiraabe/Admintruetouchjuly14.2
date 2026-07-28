import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useSessionUser } from '@/store/authStore'
import ApiService from '@/services/ApiService'
import { uploadCandidateProfilePicture } from '@/utils/fileServer'
import { notify } from '@/utils/notification'

interface ProfileData {
    avatar: string
    userName: string
    email: string
}

interface ProfileFormProps {
    data: ProfileData
}

const ProfileForm = ({ data }: ProfileFormProps) => {
    const [formData, setFormData] = useState<ProfileData>(data)
    const [loading, setLoading] = useState(false)
    const [avatarUploading, setAvatarUploading] = useState(false)
    const [partnershipLogo, setPartnershipLogo] = useState<string>('')
    const setUser = useSessionUser((state) => state.setUser)
    const { partnershipId } = useSessionUser((state) => state.user)

    useEffect(() => {
        if (partnershipId) {
            ApiService.fetchDataWithAxios<any>({
                method: 'GET',
                url: `/partnerships/${partnershipId}`,
            })
                .then((data) => {
                    if (data.success && data.data?.company_logo) {
                        setPartnershipLogo(data.data.company_logo)
                    }
                })
                .catch((err) => console.error('Failed to fetch partnership:', err))
        }
    }, [partnershipId])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setAvatarUploading(true)
        try {
            const uploaded = await uploadCandidateProfilePicture(file)
            setFormData((prev) => ({ ...prev, avatar: uploaded.url }))
        } catch (error) {
            notify.error('Avatar upload failed', error instanceof Error ? error.message : 'Unable to upload avatar')
        } finally {
            setAvatarUploading(false)
            e.target.value = ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            setUser({
                avatar: formData.avatar,
                userName: formData.userName,
                email: formData.email,
            })

            await new Promise((resolve) => setTimeout(resolve, 500))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="form-label" htmlFor="userName">
                    Full Name
                </label>
                <Input
                    id="userName"
                    name="userName"
                    placeholder="Enter your full name"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                />
            </div>

            <div>
                <label className="form-label" htmlFor="email">
                    Email Address
                </label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                </p>
            </div>

            <div>
                <label className="form-label" htmlFor="avatar">
                    Avatar URL
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        id="avatar"
                        name="avatar"
                        placeholder="Enter avatar image URL"
                        value={formData.avatar}
                        onChange={handleChange}
                    />
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                    <label
                        htmlFor="avatar-upload"
                        className={`inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary dark:border-gray-600 dark:text-gray-200 dark:hover:border-white dark:hover:text-white ${avatarUploading ? 'pointer-events-none opacity-60' : ''}`}
                    >
                        {avatarUploading ? 'Uploading...' : 'Browse'}
                    </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">Choose an image or enter an image URL.</p>
                <div className="mt-3 flex items-center gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Preview:</div>
                    <div
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm"
                        style={{
                            backgroundImage: (formData.avatar || partnershipLogo)
                                ? `url(${formData.avatar || partnershipLogo})`
                                : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {!(formData.avatar || partnershipLogo) &&
                            formData.userName?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <Button
                    variant="solid"
                    loading={loading}
                    disabled={loading}
                    type="submit"
                >
                    Save Changes
                </Button>
            </div>
        </form>
    )
}

export default ProfileForm
