import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import Toggle from '@/components/ui/Toggle'

const TwoFactorAuth = () => {
    const [twoFAEnabled, setTwoFAEnabled] = useState(false)
    const [showSetup, setShowSetup] = useState(false)
    const [verificationCode, setVerificationCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleEnableTwoFA = async () => {
        setShowSetup(true)
    }

    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) {
            alert('Please enter a valid 6-digit code')
            return
        }

        setLoading(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setTwoFAEnabled(true)
            setShowSetup(false)
            setVerificationCode('')
            alert('Two-Factor Authentication has been enabled')
        } finally {
            setLoading(false)
        }
    }

    const handleDisableTwoFA = async () => {
        if (window.confirm('Are you sure you want to disable 2FA?')) {
            setLoading(true)
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                setTwoFAEnabled(false)
                alert('Two-Factor Authentication has been disabled')
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h6 className="font-semibold mb-2">Enhanced Security</h6>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Two-factor authentication adds an extra layer of security
                    to your account by requiring a second form of verification.
                </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h6 className="font-semibold">
                            Two-Factor Authentication
                        </h6>
                        <p className="text-sm text-gray-500">
                            {twoFAEnabled
                                ? 'Your account is protected with 2FA'
                                : 'Add an extra layer of security to your account'}
                        </p>
                    </div>
                    <Toggle
                        checked={twoFAEnabled}
                        onChange={() => {
                            if (twoFAEnabled) {
                                handleDisableTwoFA()
                            } else {
                                handleEnableTwoFA()
                            }
                        }}
                    />
                </div>

                {showSetup && !twoFAEnabled && (
                    <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <Alert type="info">
                            Use an authenticator app like Google Authenticator,
                            Microsoft Authenticator, or Authy
                        </Alert>

                        <div>
                            <p className="text-sm font-semibold mb-3">
                                1. Scan this QR code
                            </p>
                            <div className="w-40 h-40 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-2xl mb-2">▌▌</p>
                                    <p className="text-xs text-gray-500">
                                        QR Code
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold mb-3">
                                2. Enter the 6-digit code
                            </p>
                            <Input
                                placeholder="000000"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) =>
                                    setVerificationCode(
                                        e.target.value.replace(/\D/g, ''),
                                    )
                                }
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="solid"
                                loading={loading}
                                disabled={loading || verificationCode.length !== 6}
                                onClick={handleVerifyCode}
                            >
                                Verify & Enable
                            </Button>
                            <Button
                                variant="plain"
                                onClick={() => setShowSetup(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {twoFAEnabled && (
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <p className="text-sm text-green-700 dark:text-green-200">
                                ✓ Two-Factor Authentication is enabled
                            </p>
                        </div>

                        <div>
                            <h6 className="font-semibold mb-3">
                                Backup Codes
                            </h6>
                            <p className="text-sm text-gray-500 mb-3">
                                Save these backup codes in a safe place. You can
                                use them to access your account if you lose
                                access to your authenticator.
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm space-y-1">
                                <div>1234-5678-9012</div>
                                <div>2345-6789-0123</div>
                                <div>3456-7890-1234</div>
                                <div>4567-8901-2345</div>
                                <div>5678-9012-3456</div>
                            </div>
                            <Button variant="plain" className="mt-3">
                                Download Codes
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h6 className="font-semibold mb-3">Trusted Devices</h6>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Devices that don't require 2FA verification
                </p>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                            <p className="text-sm font-medium">
                                Chrome on Windows
                            </p>
                            <p className="text-xs text-gray-500">
                                Last used: 2 hours ago
                            </p>
                        </div>
                        <Button variant="plain" color="danger" size="sm">
                            Remove
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TwoFactorAuth
