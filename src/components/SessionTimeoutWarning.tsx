import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'

interface SessionTimeoutWarningProps {
  isOpen: boolean
  timeLeft: number
  onExtend: () => void
  onLogout: () => void
}

const SessionTimeoutWarning = ({
  isOpen,
  timeLeft,
  onExtend,
  onLogout,
}: SessionTimeoutWarningProps) => {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {}}
      width={450}
      closable={false}
      contentClassName="!bg-red-50 dark:!bg-red-950"
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
            Session Timeout Warning
          </h2>
          <p className="text-sm text-red-800 dark:text-red-200">
            Your session will expire due to inactivity.
          </p>
        </div>

        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg border border-red-300 dark:border-red-700">
          <p className="text-center text-red-900 dark:text-red-100">
            <span className="text-3xl font-bold">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="block text-sm mt-1">Time remaining</span>
          </p>
        </div>

        <p className="text-sm text-red-800 dark:text-red-200">
          Click "Continue Session" to stay logged in, or you will be logged out automatically.
        </p>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onLogout}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Logout Now
          </Button>
          <Button
            onClick={onExtend}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            Continue Session
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default SessionTimeoutWarning
