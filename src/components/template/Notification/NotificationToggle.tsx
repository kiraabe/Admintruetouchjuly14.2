import classNames from '@/utils/classNames'
import { PiBellDuotone } from 'react-icons/pi'

const NotificationToggle = ({
    className,
    dot,
    count = 0,
}: {
    className?: string
    dot: boolean
    count?: number
}) => {
    return (
        <div className={classNames('text-2xl relative', className)}>
            <PiBellDuotone />
            {dot && count > 0 && (
                <span
                    className="badge px-2 py-1 min-w-6 rounded-full text-xs font-semibold bg-error text-white badge-inner absolute"
                    style={{ top: '0px', right: '0px' }}
                >
                    {count}
                </span>
            )}
        </div>
    )
}

export default NotificationToggle
