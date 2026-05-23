import Modal from 'react-modal'
import classNames from 'classnames'
import CloseButton from '../CloseButton'
import { motion } from 'framer-motion'
import useWindowSize from '../hooks/useWindowSize'
import ScrollBar from '../ScrollBar'
import type ReactModal from 'react-modal'
import type { MouseEvent } from 'react'

export interface DialogProps extends ReactModal.Props {
    closable?: boolean
    contentClassName?: string
    height?: string | number
    onClose?: (e: MouseEvent<HTMLSpanElement>) => void
    title?: string
    confirmText?: string
    onConfirm?: () => void
    width?: number
}

const Dialog = (props: DialogProps) => {
    const currentSize = useWindowSize()

    const {
        bodyOpenClassName,
        children,
        className,
        closable = true,
        closeTimeoutMS = 150,
        contentClassName,
        height,
        isOpen,
        onClose,
        overlayClassName,
        portalClassName,
        style,
        title,
        confirmText,
        onConfirm,
        width = 720,
        ...rest
    } = props

    const onCloseClick = (e: MouseEvent<HTMLSpanElement>) => {
        onClose?.(e)
    }

    const renderCloseButton = (
        <CloseButton
            absolute
            className="ltr:right-6 rtl:left-6 top-4.5"
            onClick={onCloseClick}
        />
    )

    const contentStyle = {
        content: {
            inset: 'unset',
        },
        ...style,
    }

    if (width !== undefined) {
        contentStyle.content.width = width

        if (
            typeof currentSize.width !== 'undefined' &&
            currentSize.width <= width
        ) {
            contentStyle.content.width = 'auto'
        }
    }

    if (height !== undefined) {
        contentStyle.content.height = height
    }

    const defaultDialogContentClass = 'dialog-content'

    const dialogClass = classNames(defaultDialogContentClass, contentClassName)

    return (
        <Modal
            className={{
                base: classNames('dialog', className as string),
                afterOpen: 'dialog-after-open',
                beforeClose: 'dialog-before-close',
            }}
            overlayClassName={{
                base: classNames('dialog-overlay', overlayClassName as string),
                afterOpen: 'dialog-overlay-after-open',
                beforeClose: 'dialog-overlay-before-close',
            }}
            portalClassName={classNames('dialog-portal', portalClassName)}
            bodyOpenClassName={classNames('dialog-open', bodyOpenClassName)}
            ariaHideApp={false}
            isOpen={isOpen}
            style={{ ...contentStyle }}
            closeTimeoutMS={closeTimeoutMS}
            {...rest}
        >
            <motion.div
                className={dialogClass}
                initial={{ transform: 'scale(0.9)' }}
                animate={{
                    transform: isOpen ? 'scale(1)' : 'scale(0.9)',
                }}
            >
                {closable && renderCloseButton}
                {title && <h2 className="text-lg font-bold mb-4">{title}</h2>}
                <ScrollBar className="dialog-body max-h-[60vh]">
                    {children}
                </ScrollBar>
                {(confirmText || onConfirm) && (
                    <div className="mt-6 flex gap-3 justify-end">
                        <button
                            onClick={() => onClose?.(null as any)}
                            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            {confirmText || 'Confirm'}
                        </button>
                    </div>
                )}
            </motion.div>
        </Modal>
    )
}

Dialog.displayName = 'Dialog'

export default Dialog
