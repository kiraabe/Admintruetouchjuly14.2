import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useSessionUser } from '@/store/authStore'

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
    const setUser = useSessionUser((state) => state.setUser)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
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
                <Input
                    id="avatar"
                    name="avatar"
                    placeholder="Enter avatar image URL"
                    value={formData.avatar}
                    onChange={handleChange}
                />
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
