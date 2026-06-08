import { useState } from 'react'
import Cookies from 'js-cookie'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

const PasswordSecurity = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const validatePassword = (password: string) => {
        const hasUpperCase = /[A-Z]/.test(password)
        const hasLowerCase = /[a-z]/.test(password)
        const hasNumbers = /\d/.test(password)
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
        const isLongEnough = password.length >= 8

        return {
            isValid:
                hasUpperCase &&
                hasLowerCase &&
                hasNumbers &&
                hasSpecialChar &&
                isLongEnough,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar,
            isLongEnough,
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        const validation = validatePassword(formData.newPassword)
        if (!validation.isValid) {
            setError('Password does not meet security requirements')
            return
        }

        setLoading(true)
        try {
            const token = Cookies.get('token') || localStorage.getItem('token')
            if (!token) {
                setError('Authentication token not found. Please sign in again.')
                return
            }

            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.message || 'Failed to change password')
                return
            }

            setSuccess(true)
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
            setTimeout(() => setSuccess(false), 5000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while changing password')
        } finally {
            setLoading(false)
        }
    }

    const passwordValidation = validatePassword(formData.newPassword)
    const isPasswordValid = formData.newPassword
        ? passwordValidation.isValid
        : null

    return (
        <div className="space-y-6">
            <Alert title="Password Security" type="info">
                Use a strong password with uppercase, lowercase, numbers, and
                special characters.
            </Alert>

            {success && (
                <Alert title="Success" type="success">
                    Your password has been changed successfully.
                </Alert>
            )}

            {error && <Alert title="Error" type="danger">{error}</Alert>}

            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div>
                    <label className="form-label" htmlFor="currentPassword">
                        Current Password
                    </label>
                    <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        placeholder="Enter your current password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="form-label" htmlFor="newPassword">
                        New Password
                    </label>
                    <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        placeholder="Enter a new password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                {formData.newPassword && (
                    <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-sm font-semibold">
                            Password Strength
                        </p>
                        <div className="space-y-1">
                            <div
                                className={`flex items-center text-sm ${
                                    passwordValidation.hasUpperCase
                                        ? 'text-green-600'
                                        : 'text-gray-500'
                                }`}
                            >
                                <span className="mr-2">
                                    {passwordValidation.hasUpperCase
                                        ? '✓'
                                        : '○'}
                                </span>
                                Uppercase letters (A-Z)
                            </div>
                            <div
                                className={`flex items-center text-sm ${
                                    passwordValidation.hasLowerCase
                                        ? 'text-green-600'
                                        : 'text-gray-500'
                                }`}
                            >
                                <span className="mr-2">
                                    {passwordValidation.hasLowerCase
                                        ? '✓'
                                        : '○'}
                                </span>
                                Lowercase letters (a-z)
                            </div>
                            <div
                                className={`flex items-center text-sm ${
                                    passwordValidation.hasNumbers
                                        ? 'text-green-600'
                                        : 'text-gray-500'
                                }`}
                            >
                                <span className="mr-2">
                                    {passwordValidation.hasNumbers
                                        ? '✓'
                                        : '○'}
                                </span>
                                Numbers (0-9)
                            </div>
                            <div
                                className={`flex items-center text-sm ${
                                    passwordValidation.hasSpecialChar
                                        ? 'text-green-600'
                                        : 'text-gray-500'
                                }`}
                            >
                                <span className="mr-2">
                                    {passwordValidation.hasSpecialChar
                                        ? '✓'
                                        : '○'}
                                </span>
                                Special characters (!@#$%^&*)
                            </div>
                            <div
                                className={`flex items-center text-sm ${
                                    passwordValidation.isLongEnough
                                        ? 'text-green-600'
                                        : 'text-gray-500'
                                }`}
                            >
                                <span className="mr-2">
                                    {passwordValidation.isLongEnough
                                        ? '✓'
                                        : '○'}
                                </span>
                                Minimum 8 characters
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="form-label" htmlFor="confirmPassword">
                        Confirm Password
                    </label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your new password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <Button
                    variant="solid"
                    loading={loading}
                    disabled={loading}
                    type="submit"
                >
                    Change Password
                </Button>
            </form>
        </div>
    )
}

export default PasswordSecurity
