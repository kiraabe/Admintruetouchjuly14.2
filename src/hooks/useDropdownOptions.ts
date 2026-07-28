import { useEffect, useState } from 'react'
import { useLocaleStore } from '@/store/localeStore'

export interface DropdownOption {
  id: number
  label: string
  slug: string
}

export interface DropdownOptions {
  genders: DropdownOption[]
  religions: DropdownOption[]
  maritalStatuses: DropdownOption[]
  jobCategories: DropdownOption[]
  educationLevels: DropdownOption[]
  medicalStatuses: DropdownOption[]
}

export function useDropdownOptions() {
  const { currentLang: locale } = useLocaleStore()
  const [options, setOptions] = useState<DropdownOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/dropdowns?locale=${locale}`)
        if (!response.ok) throw new Error('Failed to fetch dropdown options')
        const data = await response.json()
        setOptions(data.data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [locale])

  return { options, loading, error }
}
