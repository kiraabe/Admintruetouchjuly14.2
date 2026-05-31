import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Checkbox from '@/components/ui/Checkbox'
import Pagination from '@/components/ui/Pagination'
import Dropdown from '@/components/ui/Dropdown'
import { notify } from '@/utils/notification'
import { useSessionUser } from '@/store/authStore'
import { apiCreateNotification } from '@/services/CommonService'
import { getCandidateProfilePictureUrl } from '@/utils/imageUrl'

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
  profile_picture: string | null
  resume_url: string | null
  medical_status: string | null
  status: string | null
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

const parseOverEscapedJSON = (value: string | null): string => {
  if (!value) return '-'

  let result = value
  try {
    while (typeof result === 'string' && (result.startsWith('"') || result.startsWith('{'))) {
      const parsed = JSON.parse(result)
      if (typeof parsed === 'string') {
        result = parsed
      } else {
        break
      }
    }
  } catch {
    // If parsing fails, just return the original value
  }

  if (typeof result === 'string') {
    const skillMatch = result.match(/Physical Stamina|Forklift Operation|[A-Za-z\s]+/g)
    if (skillMatch) {
      const uniqueSkills = [...new Set(skillMatch.map(s => s.trim()).filter(s => s.length > 0))]
      return uniqueSkills.join(', ')
    }
  }

  return result || '-'
}

const PartnershipCandidates = () => {
  const navigate = useNavigate()
  const user = useSessionUser((state) => state.user)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<Candidate>>({})
  const [activeTab, setActiveTab] = useState('available')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCandidates, setTotalCandidates] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchCandidates(currentPage)
  }, [currentPage])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  useEffect(() => {
    let filtered = candidates

    filtered = filtered.filter((c) => c.status === activeTab)

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

    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn as keyof Candidate]
        const bValue = b[sortColumn as keyof Candidate]

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        let comparison = 0
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue
        } else {
          comparison = String(aValue).localeCompare(String(bValue))
        }

        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    setFilteredCandidates(filtered)
  }, [candidates, searchTerm, filters, activeTab, sortColumn, sortDirection])

  const fetchCandidates = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/candidates?page=${page}&limit=${pageSize}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const text = await response.text()
      if (!text) {
        console.warn('Empty response from /api/candidates')
        setCandidates([])
        notify.error('Error', 'Empty response from server')
        return
      }
      const data = JSON.parse(text)
      if (data.success) {
        setCandidates(data.data || [])
        setTotalCandidates(data.total || 0)
      } else {
        console.error('API returned success: false', data)
        setCandidates([])
        notify.error('Error', data.message || 'Failed to fetch candidates')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error fetching candidates:', error)
      setCandidates([])
      notify.error('Fetch Error', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async () => {
    try {
      if (!user.partnershipId) {
        notify.error('Error', 'Partnership ID not found. Please sign in again.')
        return
      }

      const selectedCandidateIds = selectedCandidates

      const response = await fetch('/api/standard-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnership_id: user.partnershipId,
          company_name: 'Partnership Candidates Request',
          contact_person: user.userName || 'User',
          email: user.email || '',
          position: 'Partnership Candidates',
          number_of_employees: selectedCandidates.length,
          status: 'Pending',
          candidateIds: selectedCandidateIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create request')
      }

      const responseData = await response.json()
      const requestId = responseData.data?.request_id

      // Update candidate statuses to 'processing' when partnership request is submitted
      const updateStatusPromises = selectedCandidates.map((candidateId) =>
        fetch(`/api/candidates/${candidateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'processing' }),
        })
      )

      await Promise.all(updateStatusPromises)

      // Send notification to admin about the partnership request
      try {
        const adminResponse = await fetch('/api/users/admin-users')
        if (adminResponse.ok) {
          const adminData = await adminResponse.json()
          if (adminData.data && adminData.data.length > 0) {
            const adminUserId = adminData.data[0].user_id
            await apiCreateNotification({
              target: 'Admin',
              description: `New partnership request from ${user.userName || 'Partnership User'} for ${selectedCandidates.length} candidate(s) in Partnership Candidates position`,
              type: 1,
              location: 'partnership',
              locationLabel: 'Partnership Request',
              status: 'Pending',
              user_id: adminUserId,
              related_entity_id: requestId,
              related_entity_type: 'standard_request',
            })
          }
        }
      } catch (notifError) {
        console.error('Failed to create notification:', notifError)
      }

      notify.success('Success', `Standard request created for ${selectedCandidates.length} candidate(s) - Status changed to processing`)
      setSelectedCandidates([])
      fetchCandidates(currentPage)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      notify.error('Error', errorMsg)
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
      'Status',
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
        c.status || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'partnership-candidates.csv'
    a.click()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(filteredCandidates.filter((c) => c.status?.toLowerCase() === 'available').map((c) => c.candidate_id))
    } else {
      setSelectedCandidates([])
    }
  }

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    const candidate = candidates.find((c) => c.candidate_id === candidateId)
    if (!candidate || candidate.status?.toLowerCase() !== 'available') {
      return
    }
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
          <h3 className="text-xl font-bold">Partnership Candidates</h3>
          <div className="flex flex-col md:flex-row gap-3">
            {selectedCandidates.length > 0 && (
              <button
                onClick={handleRequest}
                className="button bg-primary text-white hover:bg-primary/90 h-12 rounded-xl px-5 py-2 button-press-feedback"
              >
                <span className="flex gap-1 items-center justify-center">
                  <span>Request ({selectedCandidates.length})</span>
                </span>
              </button>
            )}
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
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {['available', 'processing', 'employee'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
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
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      {sortColumn === 'name' && sortDirection === 'asc' ? (
                        <path d="M7 14l5-5 5 5z" />
                      ) : sortColumn === 'name' && sortDirection === 'desc' ? (
                        <path d="M7 10l5 5 5-5z" />
                      ) : (
                        <path d="M7 14l5-5 5 5z M7 10l5 5 5-5z" opacity="0.3" />
                      )}
                    </svg>
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('phone_number')}
                >
                  <div className="flex items-center gap-2">
                    Phone
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('job_category')}
                >
                  <div className="flex items-center gap-2">
                    Job Category
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('nationality')}
                >
                  <div className="flex items-center gap-2">
                    Nationality
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('skill_level')}
                >
                  <div className="flex items-center gap-2">
                    Skill Level
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                  </div>
                </th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-gray-500">
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
                        disabled={candidate.status?.toLowerCase() !== 'available'}
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      <div className="flex items-center gap-3">
                        <img
                          src={getCandidateProfilePictureUrl(candidate.candidate_id, candidate.profile_picture)}
                          alt={candidate.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/img/placeholder-avatar.png'
                          }}
                        />
                        <span>{candidate.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{candidate.phone_number || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {candidate.job_category || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{candidate.nationality || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{parseOverEscapedJSON(candidate.skill_level)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        candidate.status === 'available'
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                          : candidate.status === 'processing'
                          ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                          : candidate.status === 'employee'
                          ? 'bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {candidate.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Dropdown
                        renderTitle={
                          <button className="inline-flex items-center justify-center px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded transition-colors" title="Actions">
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              viewBox="0 0 24 24"
                              height="1.2em"
                              width="1.2em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                            </svg>
                          </button>
                        }
                        menuClass="w-48"
                        placement="bottom-end"
                      >
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate)
                            setShowInfoModal(true)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          <span>View Info</span>
                        </button>
                        {candidate.resume_url && (
                          <a
                            href={`/uploads/candidates/cvs/${candidate.resume_url}`}
                            download
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                              <path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4"></path>
                              <path d="M12 13l0 9"></path>
                              <path d="M9 19l3 3l3 -3"></path>
                            </svg>
                            <span>Download Resume</span>
                          </a>
                        )}
                      </Dropdown>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Results count and pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCandidates.length} of {totalCandidates} results
          </div>
          {totalCandidates > 0 && (
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              total={totalCandidates}
              onChange={(page) => setCurrentPage(page)}
            />
          )}
        </div>
      </div>

      {/* Info Modal - Expanded Resume Style */}
      <Dialog isOpen={showInfoModal} onClose={() => setShowInfoModal(false)}>
        {selectedCandidate && (
          <div className="space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto w-full max-w-2xl">
            {/* Profile Header */}
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex justify-center mb-4">
                <img
                  src={selectedCandidate.profile_picture ? `/uploads/candidates/profile_pictures/${selectedCandidate.profile_picture}` : '/img/placeholder-avatar.png'}
                  alt={selectedCandidate.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/img/placeholder-avatar.png'
                  }}
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{selectedCandidate.name}</h2>
              <p className="text-primary font-semibold mt-2 text-lg">{selectedCandidate.job_category || 'N/A'}</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedCandidate.occupation || 'N/A'}</p>
              {selectedCandidate.candidate_id && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">ID: {selectedCandidate.candidate_id}</p>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold capitalize ${
                selectedCandidate.status === 'available'
                  ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                  : selectedCandidate.status === 'processing'
                  ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                  : selectedCandidate.status === 'employee'
                  ? 'bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {selectedCandidate.status || 'Unknown'}
              </span>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-widest">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Phone</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedCandidate.phone_number || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Nationality</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedCandidate.nationality || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Country</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedCandidate.country || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Current Location</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedCandidate.current_location || '-'}</p>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-widest">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Skill Level</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{parseOverEscapedJSON(selectedCandidate.skill_level)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Education Level</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedCandidate.education_level || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Medical Status</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedCandidate.medical_status || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Language Skills</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedCandidate.language_skills || '-'}</p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-widest">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCandidate.gender && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Gender</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.gender}</p>
                  </div>
                )}
                {selectedCandidate.age && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Age</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.age}</p>
                  </div>
                )}
                {selectedCandidate.date_of_birth && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Date of Birth</p>
                    <p className="text-gray-900 dark:text-gray-100">{new Date(selectedCandidate.date_of_birth).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedCandidate.religion && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Religion</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.religion}</p>
                  </div>
                )}
                {selectedCandidate.marital_status && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Marital Status</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.marital_status}</p>
                  </div>
                )}
                {selectedCandidate.passport_number && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Passport Number</p>
                    <p className="text-gray-900 dark:text-gray-100 font-mono">{selectedCandidate.passport_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Document & Timestamps */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-widest">Documents & Timestamps</h3>
              <div className="grid grid-cols-1 gap-4">
                {selectedCandidate.resume_url && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2">Resume</p>
                    <a
                      href={selectedCandidate.resume_url.includes('/') ? `/uploads/candidates/cvs/${selectedCandidate.resume_url.split('/').pop()}` : `/uploads/candidates/cvs/${selectedCandidate.resume_url}`}
                      download
                      className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
                        <path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4"></path>
                        <path d="M12 13l0 9"></path>
                        <path d="M9 19l3 3l3 -3"></path>
                      </svg>
                      Download Resume
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Created</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{new Date(selectedCandidate.created_at).toLocaleDateString()} {new Date(selectedCandidate.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Last Updated</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{new Date(selectedCandidate.updated_at).toLocaleDateString()} {new Date(selectedCandidate.updated_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => setShowInfoModal(false)} className="flex-1">Close</Button>
              {selectedCandidate.resume_url && (
                <a
                  href={`/uploads/candidates/cvs/${selectedCandidate.resume_url}`}
                  download
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
                    <path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4"></path>
                    <path d="M12 13l0 9"></path>
                    <path d="M9 19l3 3l3 -3"></path>
                  </svg>
                  Download Resume
                </a>
              )}
            </div>
          </div>
        )}
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
            <label className="form-label">Nationality</label>
            <Input
              placeholder="Filter by nationality"
              value={filters.nationality || ''}
              onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
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

export default PartnershipCandidates
