import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useSessionUser } from '@/store/authStore'
import ApiService from '@/services/ApiService'
import { notify } from '@/utils/notification'

interface ProfileData {
    avatar: string
    userName: string
    email: string
}

interface PartnershipData {
    company_name: string
    business_email: string
    business_category: string
    license_number: string
    contact_person_name: string
    phone_number: string
    service_city: string
}

interface ProfileFormProps {
    data: ProfileData
}

const ProfileForm = ({ data }: ProfileFormProps) => {
    const [formData, setFormData] = useState<ProfileData>(data)
    const [loading, setLoading] = useState(false)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [partnershipLogo, setPartnershipLogo] = useState<string>('')
    const [partnershipData, setPartnershipData] = useState<PartnershipData | null>(null)
    const setUser = useSessionUser((state) => state.setUser)
    const { partnershipId, authority } = useSessionUser((state) => state.user)
    const isPartnershipUser = authority?.[0] === 'partnership' || authority?.[0] === 'partner'

    useEffect(() => {
        if (partnershipId) {
            ApiService.fetchDataWithAxios<any>({
                method: 'GET',
                url: `/partnerships/${partnershipId}`,
            })
                .then((data) => {
                    if (data.success && data.data) {
                        setPartnershipLogo(data.data.company_logo || '')
                        setPartnershipData(data.data)
                    }
                })
                .catch((err) => console.error('Failed to fetch partnership:', err))
        }
    }, [partnershipId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let avatar = formData.avatar

            if (avatarFile) {
                const uploadData = new FormData()
                uploadData.append('file', avatarFile)
                const uploadResponse = await ApiService.fetchDataWithAxios<{ path: string }>({
                    method: 'POST',
                    url: '/upload/profile/avatar',
                    data: uploadData,
                })
                avatar = uploadResponse.path
            }

            const response = await ApiService.fetchDataWithAxios<{
                success: boolean
                data: { avatar: string; user_name: string }
            }>({
                method: 'PUT',
                url: '/users/me',
                data: {
                    avatar,
                    user_name: formData.userName,
                    ...(isPartnershipUser && partnershipData
                        ? { partnership: partnershipData }
                        : {}),
                },
            })

            if (!response.success) {
                throw new Error('Failed to save profile')
            }

            setFormData((current) => ({ ...current, avatar: response.data.avatar }))
            setAvatarFile(null)
            setUser({
                avatar: response.data.avatar,
                userName: response.data.user_name,
                email: formData.email,
            })
            notify.success('Success', 'Profile updated successfully')
        } catch (error) {
            notify.error(
                'Error',
                error instanceof Error ? error.message : 'Failed to save profile',
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {isPartnershipUser && partnershipData && (
                <div className="space-y-4 border-t pt-4">
                    <h6 className="font-semibold">Partnership Information</h6>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="form-label" htmlFor="companyName">Company Name</label>
                            <Input id="companyName" value={partnershipData.company_name} onChange={(e) => setPartnershipData({ ...partnershipData, company_name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="businessEmail">Business Email</label>
                            <Input id="businessEmail" type="email" value={partnershipData.business_email} onChange={(e) => setPartnershipData({ ...partnershipData, business_email: e.target.value })} required />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="businessCategory">Business Category</label>
                            <Input id="businessCategory" value={partnershipData.business_category} onChange={(e) => setPartnershipData({ ...partnershipData, business_category: e.target.value })} required />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="licenseNumber">License Number</label>
                            <Input id="licenseNumber" value={partnershipData.license_number} onChange={(e) => setPartnershipData({ ...partnershipData, license_number: e.target.value })} required />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="contactPerson">Contact Person</label>
                            <Input id="contactPerson" value={partnershipData.contact_person_name} onChange={(e) => setPartnershipData({ ...partnershipData, contact_person_name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="phoneNumber">Phone Number *</label>
                            <Input id="phoneNumber" value={partnershipData.phone_number} onChange={(e) => setPartnershipData({ ...partnershipData, phone_number: e.target.value })} required />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="serviceCity">Service City *</label>
                            <Input id="serviceCity" value={partnershipData.service_city} onChange={(e) => setPartnershipData({ ...partnershipData, service_city: e.target.value })} required />
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="form-label" htmlFor="avatarFile">
                    Choose profile picture
                </label>
                <Input
                    id="avatarFile"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
                <div className="mt-3 flex items-center gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Preview:</div>
                    <div
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm"
                        style={{
                            backgroundImage: (avatarFile || formData.avatar || partnershipLogo)
                                ? `url(${avatarFile ? URL.createObjectURL(avatarFile) : formData.avatar || partnershipLogo})`
                                : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {!(avatarFile || formData.avatar || partnershipLogo) &&
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
