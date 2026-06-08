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
            isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough,
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
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            })

            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type')
            const isJson = contentType && contentType.includes('application/json')

            if (!response.ok) {
                if (isJson) {
                    const data = await response.json()
                    setError(data.message || `Error ${response.status}: Failed to change password`)
                } else {
                    setError(`Server error (${response.status}): The password change endpoint is not available. Please contact support.`)
                }
                return
            }

            if (isJson) {
                await response.json() // consume body
            }

            setSuccess(true)
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setTimeout(() => setSuccess(false), 5000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while changing password')
        } finally {
            setLoading(false)
        }
    }

    const passwordValidation = validatePassword(formData.newPassword)

    return (
        <div className="space-y-6">
            <Alert title="Password Security" type="info">
                Use a strong password with uppercase, lowercase, numbers, and special characters.
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
                        <p className="text-sm font-semibold">Password Strength</p>
                        <div className="space-y-1">
                            {[
                                { check: passwordValidation.hasUpperCase, label: 'Uppercase letters (A-Z)' },
                                { check: passwordValidation.hasLowerCase, label: 'Lowercase letters (a-z)' },
                                { check: passwordValidation.hasNumbers,   label: 'Numbers (0-9)' },
                                { check: passwordValidation.hasSpecialChar, label: 'Special characters (!@#$%^&*)' },
                                { check: passwordValidation.isLongEnough, label: 'Minimum 8 characters' },
                            ].map(({ check, label }) => (
                                <div key={label} className={`flex items-center text-sm ${check ? 'text-green-600' : 'text-gray-500'}`}>
                                    <span className="mr-2">{check ? '✓' : '○'}</span>
                                    {label}
                                </div>
                            ))}
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

                <Button variant="solid" loading={loading} disabled={loading} type="submit">
                    Change Password
                </Button>
            </form>
        </div>
    )
}

export default PasswordSecurity