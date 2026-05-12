import classNames from '@/utils/classNames'
import Badge from '@/components/ui/Badge'
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
        <div className={classNames('text-2xl', className)}>
            {dot && count > 0 ? (
                <Badge badgeStyle={{ top: '3px', right: '6px' }} content={count}>
                    <PiBellDuotone />
                </Badge>
            ) : dot ? (
                <Badge badgeStyle={{ top: '3px', right: '6px' }}>
                    <PiBellDuotone />
                </Badge>
            ) : (
                <PiBellDuotone />
            )}
        </div>
    )
}

export default NotificationToggle
