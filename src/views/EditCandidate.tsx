import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { notify } from '@/utils/notification'
import { uploadCandidateProfilePicture, uploadCandidateCV } from '@/utils/fileServer'

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
  status: string | null
  profile_picture: string | null
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

const EditCandidate = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNewCandidate = id === 'new'
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(!isNewCandidate)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [profilePicturePreview, setProfilePicturePreview] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [resume, setResume] = useState<File | null>(null)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [filteredLocations, setFilteredLocations] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    passport_number: '',
    phone_number: '',
    gender: '',
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
    status: 'available',
  })

  useEffect(() => {
    if (!isNewCandidate) {
      fetchCandidate()
    }
  }, [id])

  const fetchCandidate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/candidates/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch candidate`)
      }
      const data = await response.json()
      if (data.success && data.data) {
        const cand = data.data
        setCandidate(cand)

        let formattedDateOfBirth = ''
        if (cand.date_of_birth) {
          const dateObj = new Date(cand.date_of_birth)
          formattedDateOfBirth = dateObj.toISOString().split('T')[0]
        }

        setFormData({
          name: cand.name || '',
          passport_number: cand.passport_number || '',
          phone_number: cand.phone_number || '',
          gender: cand.gender || '',
          date_of_birth: formattedDateOfBirth,
          nationality: cand.nationality || '',
          religion: cand.religion || '',
          marital_status: cand.marital_status || '',
          occupation: cand.occupation || '',
          job_category: cand.job_category || '',
          skill_level: cand.skill_level || '',
          education_level: cand.education_level || '',
          language_skills: cand.language_skills || '',
          country: cand.country || '',
          city: cand.city || '',
          current_location: cand.current_location || '',
          medical_status: cand.medical_status || '',
          status: cand.status || 'available',
        })

        if (cand.country) {
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
            'Ethiopia': ['Addis Ababa', 'Dire Dawa', 'Adama (Nazret)', 'Hawassa', 'Mekelle'],
          }
          setFilteredLocations(countryCities[cand.country] || [])
        }

        if (cand.profile_picture) {
          const picUrl = cand.profile_picture.startsWith('http')
            ? cand.profile_picture
            : `/uploads/candidates/profile_pictures/${cand.profile_picture}`
          setProfilePicturePreview(picUrl)
        }

        if (cand.resume_url) {
          setResumeUrl(cand.resume_url)
        }
      } else {
        notify.error('Error', 'Candidate not found')
        navigate('/candidates')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch candidate'
      console.error('Error fetching candidate:', error)
      notify.error('Error', errorMsg)
      navigate('/candidates')
    } finally {
      setLoading(false)
    }
  }

  const validateName = (name: string): string => {
    if (!name || name.trim().length === 0) return 'Candidate name is required'
    return ''
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

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })

    let error = ''
    if (field === 'name') error = validateName(value)
    else if (field === 'phone_number') error = validatePhone(value)
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
        notify.error('Invalid File', 'Profile picture must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        notify.error('Invalid File', 'Please select a valid image file')
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

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        notify.error('Invalid File', 'Resume must be less than 10MB')
        return
      }
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!validTypes.includes(file.type)) {
        notify.error('Invalid File', 'Please upload a PDF, DOC, DOCX, or TXT file')
        return
      }
      setResume(file)
      setResumeUrl(file.name)
    }
  }

  const handleCountryChange = (value: string) => {
    setFormData({ ...formData, country: value, city: '' })
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
      'Ethiopia': ['Addis Ababa', 'Dire Dawa', 'Adama (Nazret)', 'Hawassa', 'Mekelle'],
    }
    setFilteredLocations(countryCities[value] || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    newErrors.name = validateName(formData.name)
    newErrors.phone_number = validatePhone(formData.phone_number)

    if (formData.date_of_birth) {
      newErrors.date_of_birth = validateDateOfBirth(formData.date_of_birth)
    }

    setFieldErrors(newErrors)

    if (Object.values(newErrors).some((err) => err)) {
      notify.error('Validation Error', 'Please fix the errors above')
      return
    }

    try {
      const formDataToSend = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, String(value))
        }
      })

      if (profilePicture) {
        const uploadResult = await uploadCandidateProfilePicture(profilePicture)
        formDataToSend.append('profile_picture', uploadResult.filename)
      }

      if (resume) {
        const uploadResult = await uploadCandidateCV(resume)
        formDataToSend.append('resume_url', uploadResult.filename)
      }

      if (isNewCandidate) {
        notify.promise(
          fetch('/api/candidates', {
            method: 'POST',
            body: formDataToSend,
          }).then(async (response) => {
            const data = await response.json()
            if (response.ok) {
              setTimeout(() => navigate('/candidates'), 500)
              return data
            } else {
              throw new Error(data.error || 'Failed to create candidate')
            }
          }),
          {
            loading: 'Creating candidate...',
            success: 'Candidate created successfully',
            error: (err) => `${err.message}`,
          },
        )
      } else {
        notify.promise(
          fetch(`/api/candidates/${candidate?.candidate_id}`, {
            method: 'PUT',
            body: formDataToSend,
          }).then(async (response) => {
            const data = await response.json()
            if (response.ok) {
              setTimeout(() => navigate('/candidates'), 500)
              return data
            } else {
              throw new Error(data.error || 'Failed to update candidate')
            }
          }),
          {
            loading: 'Updating candidate...',
            success: 'Candidate updated successfully',
            error: (err) => `${err.message}`,
          },
        )
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error saving candidate:', error)
      notify.error('Error', errorMsg)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return

    notify.promise(
      fetch(`/api/candidates/${candidate?.candidate_id}`, { method: 'DELETE' }).then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete candidate')
        }
        setTimeout(() => navigate('/candidates'), 500)
        return data
      }),
      {
        loading: 'Deleting candidate...',
        success: 'Candidate deleted successfully',
        error: (err) => `${err.message}`,
      },
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading candidate...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="h-full">
      <div className="page-container relative h-full flex flex-auto flex-col px-4 sm:px-6 py-4 sm:py-6 md:px-8 pb-0 sm:pb-0 md:pb-0">
        {/* Header */}
        <div className="container mx-auto flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-xl">{isNewCandidate ? 'Add New Candidate' : 'Edit Candidate'}</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full h-full">
          <div className="form-container vertical flex flex-col w-full justify-between">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left Column - Form Fields */}
                <div className="gap-4 flex flex-col flex-auto">
                  {/* Overview Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">Overview</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label mb-2">Name *</label>
                          <Input
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Candidate Name"
                            className={fieldErrors.name ? 'border-red-500' : ''}
                          />
                          {fieldErrors.name && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{fieldErrors.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="form-label mb-2">Passport Number</label>
                          <Input
                            value={formData.passport_number}
                            onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                            placeholder="Passport Number"
                          />
                        </div>

                        <div>
                          <label className="form-label mb-2">Gender</label>
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
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
                          <label className="form-label mb-2">Date of Birth</label>
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
                          <label className="form-label mb-2">Phone Number *</label>
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

                        <div>
                          <label className="form-label mb-2">Nationality</label>
                          <Input
                            value={formData.nationality}
                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                            placeholder="Nationality"
                          />
                        </div>

                        <div>
                          <label className="form-label mb-2">Religion</label>
                          <select
                            value={formData.religion}
                            onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
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
                          <label className="form-label mb-2">Marital Status</label>
                          <select
                            value={formData.marital_status}
                            onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
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
                          <label className="form-label mb-2">Occupation</label>
                          <Input
                            value={formData.occupation}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            placeholder="Occupation"
                          />
                        </div>

                        <div>
                          <label className="form-label mb-2">Job Category</label>
                          <select
                            value={formData.job_category}
                            onChange={(e) => setFormData({ ...formData, job_category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
                          >
                            <option value="">Select job category</option>
                            {JOB_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label mb-2">Skill Level</label>
                          <select
                            value={formData.skill_level}
                            onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
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
                          <label className="form-label mb-2">Education Level</label>
                          <select
                            value={formData.education_level}
                            onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
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
                          <label className="form-label mb-2">Medical Status</label>
                          <select
                            value={formData.medical_status}
                            onChange={(e) => setFormData({ ...formData, medical_status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
                          >
                            <option value="">Select medical status</option>
                            {MEDICAL_STATUS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label mb-2">Language Skills</label>
                          <Input
                            value={formData.language_skills}
                            onChange={(e) => setFormData({ ...formData, language_skills: e.target.value })}
                            placeholder="e.g., English, Spanish"
                          />
                        </div>

                        <div>
                          <label className="form-label mb-2">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
                          >
                            <option value="available">Available</option>
                            <option value="Processing">Processing</option>
                            <option value="Employee">Employee</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Location Information Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">Location Information</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="form-label mb-2">Country</label>
                          <select
                            value={formData.country}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
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
                          <label className="form-label mb-2">City</label>
                          {formData.country ? (
                            <select
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
                            >
                              <option value="">Select city</option>
                              {filteredLocations.map((city) => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input placeholder="Select country first" disabled />
                          )}
                        </div>

                        <div>
                          <label className="form-label mb-2">Current Location</label>
                          <Input
                            value={formData.current_location}
                            onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                            placeholder="Current Location"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Column - Image & Account Settings */}
                <div className="md:w-[370px] gap-4 flex flex-col">
                  {/* Image Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">Profile Picture</h4>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg text-center p-4">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-600 bg-gray-200 dark:bg-gray-600">
                            {profilePicturePreview ? (
                              <img
                                src={profilePicturePreview}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                  className="w-12 h-12"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="upload">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                            id="profilePictureInput"
                          />
                          <label htmlFor="profilePictureInput">
                            <Button
                              type="button"
                              onClick={() => document.getElementById('profilePictureInput')?.click()}
                            >
                              Upload Image
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Resume Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">Resume</h4>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg text-center p-4">
                        {resumeUrl ? (
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded mb-4 border border-primary/20">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 16.5a1 1 0 11-2 0 1 1 0 012 0zM15 7H4v2h11V7zM4 5h11V3H4v2zm11 8H4v2h11v-2z" />
                              </svg>
                              <a
                                href="#"
                                onClick={async (e) => {
                                  e.preventDefault()
                                  try {
                                    const filename = resumeUrl.includes('/') ? resumeUrl.split('/').pop() : resumeUrl
                                    const downloadUrl = `/uploads/candidates/cvs/${filename}`
                                    const link = document.createElement('a')
                                    link.href = downloadUrl
                                    link.download = filename.replace(/^\d+-/, '')
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                  } catch (error) {
                                    notify.error('Error', 'Failed to download resume')
                                  }
                                }}
                                className="text-sm text-primary hover:underline truncate cursor-pointer"
                                title={resumeUrl.split('/').pop() || resumeUrl}
                              >
                                {resumeUrl.split('/').pop()?.replace(/^\d+-/, '') || resumeUrl}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setResume(null)
                                setResumeUrl(null)
                              }}
                              className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                              title="Remove resume"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm text-gray-600 dark:text-gray-400">No resume uploaded</p>
                          </div>
                        )}
                        <div className="upload">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleResumeChange}
                            className="hidden"
                            id="resumeInput"
                          />
                          <label htmlFor="resumeInput">
                            <Button
                              type="button"
                              onClick={() => document.getElementById('resumeInput')?.click()}
                            >
                              Upload Resume
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Account Settings */}
                  {!isNewCandidate && candidate && (
                    <Card className="card-border">
                      <div className="card-body">
                        <h4 className="mb-4 font-semibold">Account Status</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">ID</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Candidate ID</p>
                            </div>
                            <span className="text-sm font-mono">{candidate.candidate_id}</span>
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div>
                              <p className="font-semibold text-sm">Created</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div>
                              <p className="font-semibold text-sm">Updated</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {candidate.updated_at ? new Date(candidate.updated_at).toLocaleDateString() : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="bottom-0 left-0 right-0 z-10 mt-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 -mx-4 sm:-mx-8 py-4 sticky">
              <div className="container mx-auto">
                <div className="flex items-center justify-between px-4 sm:px-6 md:px-8">
                  <Button
                    type="button"
                    onClick={() => navigate('/candidates')}
                    variant="default"
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
                          <path d="M5 12l14 0"></path>
                          <path d="M5 12l4 4"></path>
                          <path d="M5 12l4 -4"></path>
                        </svg>
                      </span>
                      <span>Back</span>
                    </span>
                  </Button>
                  <div className="flex items-center gap-2">
                    {!isNewCandidate && (
                      <Button
                        type="button"
                        onClick={handleDelete}
                        variant="solid"
                        className="bg-transparent border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
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
                              <path d="M4 7l16 0"></path>
                              <path d="M10 11l0 6"></path>
                              <path d="M14 11l0 6"></path>
                              <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
                              <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
                            </svg>
                          </span>
                          <span>Delete</span>
                        </span>
                      </Button>
                    )}
                    <Button type="submit">{isNewCandidate ? 'Create' : 'Save'}</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

export default EditCandidate
