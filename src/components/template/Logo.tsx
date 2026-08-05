import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
    isCollapsed?: boolean
}

const LOGO_SRC_PATH = '/static/logo/'

const Logo = (props: LogoProps) => {
    const { className, imgClass, style, logoWidth = 'auto', isCollapsed = false } = props
    const logoSrc = isCollapsed ? 'collapse-logo.webp' : 'true-touch-logo.webp'

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
                src={`${LOGO_SRC_PATH}${logoSrc}`}
                alt={`${APP_NAME} logo`}
            />
        </div>
    )
}

export default Logo
