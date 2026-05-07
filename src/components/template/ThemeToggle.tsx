import useDarkMode from '@/utils/hooks/useDarkMode'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { MODE_DARK, MODE_LIGHT } from '@/constants/theme.constant'

const _ThemeToggle = () => {
    const [isDarkMode, onModeChange] = useDarkMode()

    const handleToggle = () => {
        onModeChange(isDarkMode ? MODE_LIGHT : MODE_DARK)
    }

    return (
        <button
            onClick={handleToggle}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-500" />
            ) : (
                <MoonIcon className="w-5 h-5 text-gray-600" />
            )}
        </button>
    )
}

const ThemeToggle = withHeaderItem(_ThemeToggle)

export default ThemeToggle
