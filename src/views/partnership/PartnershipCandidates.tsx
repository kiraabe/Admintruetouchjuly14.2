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

const PartnershipCandidates = () => {
  const navigate = useNavigate()
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

  const handleRequest = () => {
    const selectedCandidateObjects = filteredCandidates.filter((c) =>
      selectedCandidates.includes(c.candidate_id)
    )

    const candidatesData = selectedCandidateObjects.map((c) => ({
      id: c.id,
      candidate_id: c.candidate_id,
      name: c.name,
      job_category: c.job_category,
      skill_level: c.skill_level,
      phone_number: c.phone_number,
      nationality: c.nationality,
    }))

    sessionStorage.setItem('selectedCandidates', JSON.stringify(candidatesData))
    navigate('/special-request')
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
          {['available', 'Processing', 'Employee'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab}
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
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      <div className="flex items-center gap-3">
                        <img
                          src={candidate.profile_picture || '/img/placeholder-avatar.png'}
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
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{candidate.skill_level || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        candidate.status === 'available'
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                          : candidate.status === 'Processing'
                          ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                          : candidate.status === 'Employee'
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
                            href={candidate.resume_url}
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

      {/* Info Modal */}
      <Dialog isOpen={showInfoModal} onClose={() => setShowInfoModal(false)}>
        {selectedCandidate && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold mb-4">{selectedCandidate.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phone</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.phone_number || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Passport</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.passport_number || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Gender</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.gender || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Age</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.age || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Date of Birth</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.date_of_birth || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Nationality</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.nationality || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Religion</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.religion || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Marital Status</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.marital_status || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Occupation</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.occupation || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Job Category</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.job_category || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Skill Level</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.skill_level || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Education Level</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.education_level || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Language Skills</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.language_skills || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Country</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.country || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">City</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.city || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Current Location</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.current_location || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Medical Status</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.medical_status || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCandidate.status || '-'}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowInfoModal(false)}>Close</Button>
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
