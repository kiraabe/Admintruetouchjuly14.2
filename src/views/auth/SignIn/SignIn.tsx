import Logo from '@/components/template/Logo'
import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import SignInForm from './components/SignInForm'
import { useThemeStore } from '@/store/themeStore'

type SignInProps = {
    signUpUrl?: string
    forgetPasswordUrl?: string
    disableSubmit?: boolean
}

export const SignInBase = ({
    signUpUrl = '/sign-up',
    forgetPasswordUrl = '/forgot-password',
    disableSubmit,
}: SignInProps) => {
    const mode = useThemeStore((state) => state.mode)
    const [showContactAdmin, setShowContactAdmin] = useState(false)

    return (
        <>
            <div className="mb-8">
                <Logo
                    type="streamline"
                    mode={mode}
                    imgClass="mx-auto"
                    logoWidth={320}
                />
            </div>
            <div className="mb-10">
                <h2 className="mb-2">Welcome back!</h2>
                <p className="font-semibold heading-text">
                    Please enter your credentials to sign in!
                </p>
            </div>
            <SignInForm
                disableSubmit={disableSubmit}
                passwordHint={
                    <div className="mb-7 mt-2">
                        <button
                            type="button"
                            onClick={() => setShowContactAdmin(true)}
                            className="font-semibold heading-text mt-2 underline"
                        >
                            Forgot password
                        </button>
                    </div>
                }
            />
            <Dialog
                isOpen={showContactAdmin}
                onClose={() => setShowContactAdmin(false)}
                title="Contact your administrator"
                width={460}
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Please contact your administrator to reset your password.
                        They can verify your account and help you regain access.
                    </p>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowContactAdmin(false)}
                            className="button bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

const SignIn = () => {
    return <SignInBase />
}

export default SignIn
