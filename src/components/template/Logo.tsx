import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
}

const LOGO_SRC_PATH = '/static/logo/'

const Logo = (props: LogoProps) => {
    const { className, imgClass, style, logoWidth = 'auto' } = props

    return (
        <div
            className={classNames('logo', className)}
            style={{
                ...style,
                ...{ width: logoWidth },
            }}
        >
            <img
                className={classNames('block h-auto w-full object-contain', imgClass)}
                src={`${LOGO_SRC_PATH}true-touch-logo.webp`}
                alt={`${APP_NAME} logo`}
            />
        </div>
    )
}

export default Logo
