import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Checkbox from '@/components/ui/Checkbox'

interface Candidate {
  id: number
  candidate_id: string
  name: string
  passport_number: string | null
  phone_number: string | null
  gender: string | null
  age: number | null
  date_of_birth: string | null
  nationality: string | null
  religion: string | null
  marital_status: string | null
  occupation: string | null
  job_category: string | null
  skill_level: string | null
  education_level: string | null
  language_skills: string | null
  country: string | null
  city: string | null
  current_location: string | null
  resume_url: string | null
  medical_status: string | null
  created_at: Date
  updated_at: Date
}

const JOB_CATEGORIES = [
  'Housekeepers',
  'Cleaners',
  'Nannies and caregivers',
  'Drivers',
  'Warehouse staff',
  'Retail store employees',
  'Waiters/waitresses',
  'Laundry services',
  '5-star hotel security',
  'Kitchen helpers',
  'Construction workers',
  'Laborers',
  'Electricians',
]

const EDUCATION_LEVELS = ['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'PhD']
const SKILL_LEVELS = ['Entry', 'Intermediate', 'Advanced', 'Expert']
const GENDERS = ['Male', 'Female', 'Other']
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed']
const RELIGIONS = ['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Judaism', 'Sikhism', 'Atheism', 'Agnosticism', 'Other']
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Portuguese', 'Russian', 'Japanese', 'Hindi']
const COUNTRIES = ['India', 'Philippines', 'Indonesia', 'Vietnam', 'Thailand', 'Malaysia', 'Singapore', 'Sri Lanka', 'Bangladesh', 'Myanmar', 'Ethiopia']
const MEDICAL_STATUS = ['Fit', 'Fit with restrictions', 'Unfit', 'Under review', 'Not assessed']

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<Candidate>>({})
  const [languageSearch, setLanguageSearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [filteredLanguages, setFilteredLanguages] = useState<string[]>(LANGUAGES)
  const [filteredLocations, setFilteredLocations] = useState<string[]>([])
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    passport_number: '',
    phone_number: '',
    password: '',
    gender: '',
    age: '',
    date_of_birth: '',
    nationality: '',
    religion: '',
    marital_status: '',
    occupation: '',
    job_category: '',
    skill_level: '',
    education_level: '',
    language_skills: '',
    country: '',
    city: '',
    current_location: '',
    medical_status: '',
  })

  useEffect(() => {
    fetchCandidates()
  }, [])

  useEffect(() => {
    let filtered = candidates

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (Object.keys(filters).length > 0) {
      filtered = filtered.filter((c) => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true
          const candidateValue = c[key as keyof Candidate]
          if (typeof candidateValue === 'string') {
            return candidateValue.toLowerCase().includes(String(value).toLowerCase())
          }
          return candidateValue === value
        })
      })
    }

    setFilteredCandidates(filtered)
  }, [candidates, searchTerm, filters])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/candidates')
      const data = await response.json()
      if (data.success) {
        setCandidates(data.data)
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const validatePhone = (phone: string): string => {
    if (!phone) return 'Phone number is required'
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(phone)) return 'Phone number contains invalid characters'
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length < 7) return 'Phone number must be at least 7 digits'
    if (digitsOnly.length > 15) return 'Phone number must not exceed 15 digits'
    return ''
  }

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required'
    if (password.length < 6 || password.length > 9) return 'Password must be 6-9 characters'
    if (!/^[a-zA-Z0-9]+$/.test(password)) return 'Only letters and numbers allowed (no special characters)'
    return ''
  }

  const validateName = (name: string): string => {
    if (!name || name.trim().length === 0) return 'Candidate name is required'
    return ''
  }

  const validateAge = (age: string): string => {
    if (!age) return ''
    const ageNum = parseInt(age)
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) return 'Age must be between 18 and 120'
    return ''
  }

  const validateDateOfBirth = (dob: string): string => {
    if (!dob) return ''
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18) return 'Must be 18 years or older'
    return ''
  }

  const validateProfilePicture = (): string => {
    if (!editingCandidate && !profilePicture && !profilePicturePreview) {
      return 'Profile picture is required'
    }
    return ''
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })

    let error = ''
    if (field === 'name') error = validateName(value)
    else if (field === 'password') error = validatePassword(value)
    else if (field === 'phone_number') error = validatePhone(value)
    else if (field === 'age') error = validateAge(value)
    else if (field === 'date_of_birth') error = validateDateOfBirth(value)

    setFieldErrors({
      ...fieldErrors,
      [field]: error,
    })
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddNew = () => {
    setEditingCandidate(null)
    setFormData({
      name: '',
      passport_number: '',
      phone_number: '',
      password: '',
      gender: '',
      age: '',
      date_of_birth: '',
      nationality: '',
      religion: '',
      marital_status: '',
      occupation: '',
      job_category: '',
      skill_level: '',
      education_level: '',
      language_skills: '',
      country: '',
      city: '',
      current_location: '',
      medical_status: '',
    })
    setProfilePicture(null)
    setProfilePicturePreview('')
    setFieldErrors({})
    setError('')
    setShowModal(true)
  }

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setFormData({
      name: candidate.name,
      passport_number: candidate.passport_number || '',
      phone_number: candidate.phone_number || '',
      gender: candidate.gender || '',
      age: candidate.age?.toString() || '',
      date_of_birth: candidate.date_of_birth || '',
      nationality: candidate.nationality || '',
      religion: candidate.religion || '',
      marital_status: candidate.marital_status || '',
      occupation: candidate.occupation || '',
      job_category: candidate.job_category || '',
      skill_level: candidate.skill_level || '',
      education_level: candidate.education_level || '',
      language_skills: candidate.language_skills || '',
      country: candidate.country || '',
      city: candidate.city || '',
      current_location: candidate.current_location || '',
      medical_status: candidate.medical_status || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const newErrors: Record<string, string> = {}

    newErrors.name = validateName(formData.name)

    if (!editingCandidate) {
      newErrors.password = validatePassword(formData.password)
      newErrors.phone_number = validatePhone(formData.phone_number)
      const profileError = validateProfilePicture()
      if (profileError) newErrors.profile_picture = profileError
    }

    if (formData.date_of_birth) {
      newErrors.date_of_birth = validateDateOfBirth(formData.date_of_birth)
    }

    if (formData.age) {
      newErrors.age = validateAge(formData.age)
    }

    setFieldErrors(newErrors)

    if (Object.values(newErrors).some((err) => err)) {
      return
    }

    try {
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
      }

      if (editingCandidate) {
        const response = await fetch(`/api/candidates/${editingCandidate.candidate_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()
        if (response.ok) {
          await fetchCandidates()
          setShowModal(false)
        } else {
          setError(data.error || 'Failed to update candidate')
        }
      } else {
        const response = await fetch('/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()
        if (response.ok) {
          await fetchCandidates()
          setShowModal(false)
          setFormData({
            name: '',
            passport_number: '',
            phone_number: '',
            password: '',
            gender: '',
            age: '',
            date_of_birth: '',
            nationality: '',
            religion: '',
            marital_status: '',
            occupation: '',
            job_category: '',
            skill_level: '',
            education_level: '',
            language_skills: '',
            country: '',
            city: '',
            current_location: '',
            medical_status: '',
          })
          setProfilePicture(null)
          setProfilePicturePreview('')
          setPhoneVerified(false)
        } else {
          setError(data.error || 'Failed to create candidate')
        }
      }
    } catch (error) {
      console.error('Error saving candidate:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async (candidateId: string) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return

    try {
      await fetch(`/api/candidates/${candidateId}`, { method: 'DELETE' })
      await fetchCandidates()
    } catch (error) {
      console.error('Error deleting candidate:', error)
    }
  }

  const handleDownload = () => {
    const headers = [
      'Name',
      'Phone',
      'Passport',
      'Gender',
      'Age',
      'Nationality',
      'Job Category',
      'Skill Level',
      'Country',
    ]
    const csv = [
      headers,
      ...filteredCandidates.map((c) => [
        c.name,
        c.phone_number || '',
        c.passport_number || '',
        c.gender || '',
        c.age || '',
        c.nationality || '',
        c.job_category || '',
        c.skill_level || '',
        c.country || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'candidates.csv'
    a.click()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(filteredCandidates.map((c) => c.candidate_id))
    } else {
      setSelectedCandidates([])
    }
  }

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates([...selectedCandidates, candidateId])
    } else {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== candidateId))
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h3 className="text-xl font-bold">Candidates</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={handleDownload}
              className="button bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-700 ring-primary dark:ring-white hover:border-primary dark:hover:border-white hover:ring-1 hover:text-primary dark:hover:text-white dark:hover:bg-transparent text-gray-600 dark:text-gray-100 h-12 rounded-xl px-5 py-2 button-press-feedback"
            >
              <span className="flex gap-1 items-center justify-center">
                <span className="text-lg">
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4"></path>
                    <path d="M12 13l0 9"></path>
                    <path d="M9 19l3 3l3 -3"></path>
                  </svg>
                </span>
                <span>Download</span>
              </span>
            </button>
            <Button onClick={handleAddNew}>
              <span className="flex gap-1 items-center justify-center">
                <span className="text-lg">
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"></path>
                    <path d="M16 19h6"></path>
                    <path d="M19 16v6"></path>
                    <path d="M6 21v-2a4 4 0 0 1 4 -4h4"></path>
                  </svg>
                </span>
                <span>Add new</span>
              </span>
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="input-wrapper relative flex-1">
            <Input
              placeholder="Quick search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 focus:ring-primary focus-within:ring-primary focus-within:border-primary focus:border-primary"
            />
            <div className="input-suffix-end absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-lg"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 0 0 -14 0"></path>
                <path d="M21 21l-6 -6"></path>
              </svg>
            </div>
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            className="button bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-700 ring-primary dark:ring-white hover:border-primary dark:hover:border-white hover:ring-1 hover:text-primary dark:hover:text-white dark:hover:bg-transparent text-gray-600 dark:text-gray-100 h-12 rounded-xl px-5 py-2 button-press-feedback"
          >
            <span className="flex gap-1 items-center justify-center">
              <span className="text-lg">
                <svg
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z"></path>
                </svg>
              </span>
              <span>Filter</span>
            </span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 w-12">
                  <Checkbox
                    checked={
                      selectedCandidates.length === filteredCandidates.length &&
                      filteredCandidates.length > 0
                    }
                    onChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                </th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Job Category</th>
                <th className="text-left py-3 px-4">Nationality</th>
                <th className="text-left py-3 px-4">Skill Level</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No candidates found
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr
                    key={candidate.candidate_id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4 w-12">
                      <Checkbox
                        checked={selectedCandidates.includes(candidate.candidate_id)}
                        onChange={(checked) => handleSelectCandidate(candidate.candidate_id, checked as boolean)}
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold">{candidate.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{candidate.phone_number || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {candidate.job_category || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{candidate.nationality || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{candidate.skill_level || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(candidate)}
                          className="text-xl cursor-pointer hover:text-primary"
                          title="Edit"
                        >
                          <svg
                            stroke="currentColor"
                            fill="none"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"></path>
                            <path d="M13.5 6.5l4 4"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.candidate_id)}
                          className="text-xl cursor-pointer hover:text-red-500"
                          title="Delete"
                        >
                          <svg
                            stroke="currentColor"
                            fill="none"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M4 7l16 0"></path>
                            <path d="M10 11l0 6"></path>
                            <path d="M14 11l0 6"></path>
                            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
                            <path d="M9 7v-1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v1"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCandidates.length} of {candidates.length} results
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog isOpen={showModal} onClose={() => { setShowModal(false); setError('') }} width={800}>
        <div className="mb-4">
          <h2 className="text-lg font-bold">{editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}</h2>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Candidate Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className={fieldErrors.name ? 'border-red-500' : ''}
              />
              {fieldErrors.name && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="form-label">Passport Number</label>
              <Input
                value={formData.passport_number}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Phone Number {!editingCandidate && '*'}</label>
              <Input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={fieldErrors.phone_number ? 'border-red-500' : ''}
              />
              {fieldErrors.phone_number && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{fieldErrors.phone_number}</p>
              )}
            </div>

            {!editingCandidate && (
              <>
                <div>
                  <label className="form-label">Password *</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    placeholder="6-9 characters, letters & numbers only"
                    className={fieldErrors.password ? 'border-red-500' : ''}
                  />
                  {fieldErrors.password && (
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="form-label">Upload Profile Picture *</label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer ${
                          fieldErrors.profile_picture ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/GIF</p>
                      {fieldErrors.profile_picture && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{fieldErrors.profile_picture}</p>
                      )}
                    </div>
                    {profilePicturePreview && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-300">
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="form-label">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Date of Birth</label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                className={fieldErrors.date_of_birth ? 'border-red-500' : ''}
              />
              {fieldErrors.date_of_birth && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{fieldErrors.date_of_birth}</p>
              )}
            </div>

            <div>
              <label className="form-label">Age</label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => handleFieldChange('age', e.target.value)}
                placeholder="Enter age"
                className={fieldErrors.age ? 'border-red-500' : ''}
              />
              {fieldErrors.age && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{fieldErrors.age}</p>
              )}
            </div>

            <div>
              <label className="form-label">Nationality</label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Religion</label>
              <select
                value={formData.religion}
                onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select religion</option>
                {RELIGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Marital Status</label>
              <select
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select status</option>
                {MARITAL_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>



            <div>
              <label className="form-label">Skill Level</label>
              <select
                value={formData.skill_level}
                onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select skill level</option>
                {SKILL_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Education Level</label>
              <select
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select education level</option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Job Category</label>
              <select
                value={formData.job_category}
                onChange={(e) => setFormData({ ...formData, job_category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select job category</option>
                {JOB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="form-label">Language Skills</label>
              <Input
                value={languageSearch}
                onChange={(e) => {
                  setLanguageSearch(e.target.value)
                  setShowLanguageDropdown(true)
                  setFilteredLanguages(
                    LANGUAGES.filter((l) =>
                      l.toLowerCase().includes(e.target.value.toLowerCase())
                    )
                  )
                }}
                onFocus={() => setShowLanguageDropdown(true)}
                placeholder="Search and select languages..."
              />
              {showLanguageDropdown && filteredLanguages.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                  {filteredLanguages.map((lang) => (
                    <div
                      key={lang}
                      onClick={() => {
                        const current = formData.language_skills ? formData.language_skills.split(',').map(l => l.trim()) : []
                        if (!current.includes(lang)) {
                          setFormData({
                            ...formData,
                            language_skills: current.length > 0 ? current.join(', ') + ', ' + lang : lang,
                          })
                        }
                        setLanguageSearch('')
                        setShowLanguageDropdown(false)
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      {lang}
                    </div>
                  ))}
                </div>
              )}
              {formData.language_skills && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.language_skills.split(',').map((lang) => (
                    <span
                      key={lang.trim()}
                      className="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {lang.trim()}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.language_skills
                            .split(',')
                            .map(l => l.trim())
                            .filter(l => l !== lang.trim())
                            .join(', ')
                          setFormData({ ...formData, language_skills: updated })
                        }}
                        className="font-bold hover:text-gray-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Country</label>
              <select
                value={formData.country}
                onChange={(e) => {
                  setFormData({ ...formData, country: e.target.value, city: '' })
                  // Update location suggestions based on country
                  const countryCities: Record<string, string[]> = {
                    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'],
                    'Philippines': ['Manila', 'Cebu', 'Davao', 'Quezon City', 'Makati'],
                    'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'],
                    'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho'],
                    'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Chon Buri'],
                    'Malaysia': ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Ipoh', 'Klang'],
                    'Singapore': ['Singapore'],
                    'Sri Lanka': ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Matara'],
                    'Bangladesh': ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet'],
                    'Myanmar': ['Yangon', 'Mandalay', 'Naypyidaw', 'Bagan', 'Tachileik'],
                    'Ethiopia': ['Addis Ababa', 'Dire Dawa', 'Adama (Nazret)', 'Hawassa', 'Mekelle', 'Bahir Dar', 'Gondar', 'Jimma', 'Jigjiga', 'Harar', 'Dessie', 'Bishoftu (Debre Zeit)', 'Kombolcha', 'Shashamane', 'Arba Minch', 'Nekemte', 'Dilla', 'Debre Birhan', 'Asella', 'Wolkite', 'Hosaena', 'Semera', 'Gambela', 'Assosa', 'Axum', 'Debre Markos', 'Woldia', 'Waliso', 'Yirgalem', 'Goba', 'Mizan Teferi'],
                  }
                  setFilteredLocations(countryCities[e.target.value] || [])
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">City</label>
              {formData.country ? (
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select city</option>
                  {filteredLocations.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Select country first"
                  disabled
                />
              )}
            </div>

            <div>
              <label className="form-label">Current Location</label>
              <Input
                value={formData.current_location}
                onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Medical Status</label>
              <select
                value={formData.medical_status}
                onChange={(e) => setFormData({ ...formData, medical_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select medical status</option>
                {MEDICAL_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit">{editingCandidate ? 'Update' : 'Add'} Candidate</Button>
            <Button onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Dialog>

      {/* Filter Modal */}
      <Dialog isOpen={showFilterModal} onClose={() => setShowFilterModal(false)}>
        <div className="mb-4">
          <h2 className="text-lg font-bold">Filter Candidates</h2>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="form-label">Job Category</label>
            <select
              value={filters.job_category || ''}
              onChange={(e) => setFilters({ ...filters, job_category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All categories</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Skill Level</label>
            <select
              value={filters.skill_level || ''}
              onChange={(e) => setFilters({ ...filters, skill_level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All levels</option>
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Education Level</label>
            <select
              value={filters.education_level || ''}
              onChange={(e) => setFilters({ ...filters, education_level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All levels</option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Nationality</label>
            <Input
              placeholder="Filter by nationality"
              value={filters.nationality || ''}
              onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Country</label>
            <Input
              placeholder="Filter by country"
              value={filters.country || ''}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => setShowFilterModal(false)}>Close</Button>
            <Button onClick={() => { setFilters({}); setShowFilterModal(false); }}>
              Reset Filters
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  )
}

export default Candidates
