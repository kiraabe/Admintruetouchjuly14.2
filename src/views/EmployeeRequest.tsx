import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Checkbox from '@/components/ui/Checkbox'
import { notify } from '@/utils/notification'

interface EmployeeRequest {
  id: number
  request_id: string
  request_type: 'Standard' | 'Special'
  company_name: string
  contact_person: string
  email: string
  phone_number: string | null
  position: string
  number_of_employees: number
  start_date: string | null
  location: string | null
  status: string
  requirements: string | null
  notes: string | null
  salary_range: string | null
  required_skills: string | null
  work_city: string | null
  urgency: string | null
  created_at: string
  updated_at: string
}

interface Candidate {
  candidate_id: string
  name: string
  job_category: string
  skill_level: string
  education_level: string
  nationality: string
  phone_number: string
  status: string
}

const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'In Progress', 'Completed']

const EmployeeRequest = () => {
  const [requests, setRequests] = useState<EmployeeRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<EmployeeRequest[]>([])
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequest | null>(null)
  const [filters, setFilters] = useState<Partial<EmployeeRequest>>({})
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [activeTab, setActiveTab] = useState<'all' | 'standard' | 'special'>('all')
  const [showCandidateModal, setShowCandidateModal] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [candidateSearchTerm, setCandidateSearchTerm] = useState('')
  const [currentStandardRequest, setCurrentStandardRequest] = useState<EmployeeRequest | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  useEffect(() => {
    let filtered = requests

    if (activeTab === 'standard') {
      filtered = filtered.filter((r) => r.request_type === 'Standard')
    } else if (activeTab === 'special') {
      filtered = filtered.filter((r) => r.request_type === 'Special')
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (Object.keys(filters).length > 0) {
      filtered = filtered.filter((r) => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true
          const requestValue = r[key as keyof EmployeeRequest]
          if (typeof requestValue === 'string') {
            return requestValue.toLowerCase().includes(String(value).toLowerCase())
          }
          return requestValue === value
        })
      })
    }

    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn as keyof EmployeeRequest]
        const bValue = b[sortColumn as keyof EmployeeRequest]

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

    setFilteredRequests(filtered)
  }, [requests, searchTerm, filters, sortColumn, sortDirection, activeTab])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employee-requests')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const text = await response.text()
      if (!text) {
        console.warn('Empty response from /api/employee-requests')
        setRequests([])
        return
      }
      const data = JSON.parse(text)
      if (data.success) {
        setRequests(data.data || [])
      } else {
        console.error('API returned success: false', data)
        setRequests([])
        notify.error('Error', data.message || 'Failed to fetch employee requests')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error fetching employee requests:', error)
      setRequests([])
      notify.error('Fetch Error', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (request: EmployeeRequest, newStatus: string) => {
    try {
      const toastId = notify.loading('Updating request...')
      const response = await fetch(`/api/employee-requests/${request.request_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.error || 'Failed to update request'
        notify.error('Update Failed', errorMsg)
        return
      }

      await fetchRequests()
      notify.success('Success', 'Request updated successfully')
      setShowDetailsModal(false)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error updating request:', error)
      notify.error('Update Error', errorMsg)
    }
  }

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates')
      const data = await response.json()
      if (data.success) {
        setCandidates(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
      notify.error('Fetch Error', 'Failed to load candidates')
    }
  }

  const handleOpenCandidateModal = (request: EmployeeRequest) => {
    setCurrentStandardRequest(request)
    setSelectedCandidates([])
    setCandidateSearchTerm('')
    fetchCandidates()
    setShowCandidateModal(true)
  }

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates([...selectedCandidates, candidateId])
    } else {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== candidateId))
    }
  }

  const handleSelectAllCandidates = (checked: boolean) => {
    if (checked) {
      const filteredIds = candidates
        .filter((c) =>
          c.name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
          c.job_category.toLowerCase().includes(candidateSearchTerm.toLowerCase())
        )
        .map((c) => c.candidate_id)
      setSelectedCandidates(filteredIds)
    } else {
      setSelectedCandidates([])
    }
  }

  const handleConfirmCandidateSelection = async () => {
    if (!currentStandardRequest || selectedCandidates.length === 0) {
      notify.error('Error', 'Please select at least one candidate')
      return
    }

    try {
      notify.loading('Assigning candidates...')

      // For now, just update request status to show candidates are matched
      const response = await fetch(`/api/employee-requests/${currentStandardRequest.request_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentStandardRequest,
          status: 'Approved',
          notes: `${currentStandardRequest.notes || ''}\n[${selectedCandidates.length} candidates matched]`
        }),
      })

      if (response.ok) {
        notify.success('Success', `${selectedCandidates.length} candidates selected for "${currentStandardRequest.company_name}"`)
        setShowCandidateModal(false)
        fetchRequests()
      } else {
        notify.error('Error', 'Failed to update request')
      }
    } catch (error) {
      console.error('Error:', error)
      notify.error('Error', 'Failed to process selection')
    }
  }

  const handleDelete = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return

    try {
      const toastId = notify.loading('Deleting request...')
      const response = await fetch(`/api/employee-requests/${requestId}`, { method: 'DELETE' })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.error || 'Failed to delete request'
        notify.error('Delete Failed', errorMsg)
        return
      }

      await fetchRequests()
      notify.success('Success', 'Request deleted successfully')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error deleting request:', error)
      notify.error('Delete Error', errorMsg)
    }
  }

  const handleDownload = () => {
    const headers = [
      'Company Name',
      'Contact Person',
      'Email',
      'Phone',
      'Position',
      'Number of Employees',
      'Location',
      'Status',
      'Start Date',
    ]
    const csv = [
      headers,
      ...filteredRequests.map((r) => [
        r.company_name,
        r.contact_person,
        r.email,
        r.phone_number || '',
        r.position,
        r.number_of_employees,
        r.location || '',
        r.status,
        r.start_date || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee-requests.csv'
    a.click()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(filteredRequests.map((r) => r.request_id))
    } else {
      setSelectedRequests([])
    }
  }

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests([...selectedRequests, requestId])
    } else {
      setSelectedRequests(selectedRequests.filter((id) => id !== requestId))
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
      case 'Pending':
        return 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Rejected':
        return 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200'
      case 'In Progress':
        return 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
      case 'Completed':
        return 'bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h3 className="text-xl font-bold">Employee Requests</h3>
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

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('standard')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'standard'
                ? 'border-primary text-primary dark:text-primary'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Standard ({requests.filter((r) => r.request_type === 'Standard').length})
          </button>
          <button
            onClick={() => setActiveTab('special')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'special'
                ? 'border-primary text-primary dark:text-primary'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Special ({requests.filter((r) => r.request_type === 'Special').length})
          </button>
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

        {/* Content: Cards for Standard, Table for Special */}
        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No requests found</div>
        ) : activeTab === 'standard' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((request) => (
              <div
                key={request.request_id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md dark:hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {request.company_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {request.contact_person}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadgeColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Position:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {request.position}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Employees:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {request.number_of_employees}
                    </span>
                  </div>
                  {request.location && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                        {request.location}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleOpenCandidateModal(request)}
                    className="flex-1 py-2 px-3 rounded-lg bg-green-600 text-white text-sm font-medium hover:opacity-90 transition"
                  >
                    Select Candidates
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(request)
                      setShowDetailsModal(true)
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium hover:opacity-90 transition"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 w-12">
                    <Checkbox
                      checked={
                        filteredRequests.every((r) => selectedRequests.includes(r.request_id)) &&
                        filteredRequests.length > 0
                      }
                      onChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                  </th>
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center gap-2">
                      Company Name
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        {sortColumn === 'company_name' && sortDirection === 'asc' ? (
                          <path d="M7 14l5-5 5 5z" />
                        ) : sortColumn === 'company_name' && sortDirection === 'desc' ? (
                          <path d="M7 10l5 5 5-5z" />
                        ) : (
                          <path d="M7 14l5-5 5 5z M7 10l5 5 5-5z" opacity="0.3" />
                        )}
                      </svg>
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                    onClick={() => handleSort('contact_person')}
                  >
                    <div className="flex items-center gap-2">
                      Contact Person
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        {sortColumn === 'contact_person' && sortDirection === 'asc' ? (
                          <path d="M7 14l5-5 5 5z" />
                        ) : sortColumn === 'contact_person' && sortDirection === 'desc' ? (
                          <path d="M7 10l5 5 5-5z" />
                        ) : (
                          <path d="M7 14l5-5 5 5z M7 10l5 5 5-5z" opacity="0.3" />
                        )}
                      </svg>
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                    onClick={() => handleSort('position')}
                  >
                    <div className="flex items-center gap-2">
                      Position
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        {sortColumn === 'position' && sortDirection === 'asc' ? (
                          <path d="M7 14l5-5 5 5z" />
                        ) : sortColumn === 'position' && sortDirection === 'desc' ? (
                          <path d="M7 10l5 5 5-5z" />
                        ) : (
                          <path d="M7 14l5-5 5 5z M7 10l5 5 5-5z" opacity="0.3" />
                        )}
                      </svg>
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                    onClick={() => handleSort('number_of_employees')}
                  >
                    <div className="flex items-center gap-2">
                      # of Employees
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        {sortColumn === 'number_of_employees' && sortDirection === 'asc' ? (
                          <path d="M7 14l5-5 5 5z" />
                        ) : sortColumn === 'number_of_employees' && sortDirection === 'desc' ? (
                          <path d="M7 10l5 5 5-5z" />
                        ) : (
                          <path d="M7 14l5-5 5 5z M7 10l5 5 5-5z" opacity="0.3" />
                        )}
                      </svg>
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        {sortColumn === 'status' && sortDirection === 'asc' ? (
                          <path d="M7 14l5-5 5 5z" />
                        ) : sortColumn === 'status' && sortDirection === 'desc' ? (
                          <path d="M7 10l5 5 5-5z" />
                        ) : (
                          <path d="M7 14l5-5 5 5z M7 10l5 5 5-5z" opacity="0.3" />
                        )}
                      </svg>
                    </div>
                  </th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr
                    key={request.request_id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4 w-12">
                      <Checkbox
                        checked={selectedRequests.includes(request.request_id)}
                        onChange={(checked) =>
                          handleSelectRequest(request.request_id, checked as boolean)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold">{request.company_name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {request.contact_person}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {request.position}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {request.number_of_employees}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadgeColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowDetailsModal(true)
                          }}
                          className="text-xl cursor-pointer hover:text-primary"
                          title="View Details"
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
                        </button>
                        <button
                          onClick={() => handleDelete(request.request_id)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredRequests.length} of {requests.length} results
        </div>
      </div>

      {/* Filter Modal */}
      <Dialog isOpen={showFilterModal} onClose={() => setShowFilterModal(false)}>
        <div className="mb-4">
          <h2 className="text-lg font-bold">Filter Requests</h2>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="form-label">Request Type</label>
            <select
              value={filters.request_type || ''}
              onChange={(e) => setFilters({ ...filters, request_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All types</option>
              <option value="Standard">Standard</option>
              <option value="Special">Special</option>
            </select>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Position</label>
            <Input
              placeholder="Filter by position"
              value={filters.position || ''}
              onChange={(e) => setFilters({ ...filters, position: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Location</label>
            <Input
              placeholder="Filter by location"
              value={filters.location || ''}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
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

      {/* Details Modal */}
      <Dialog isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
        {selectedRequest && (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto w-full max-w-3xl">
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold">Request Details</h2>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200">
                  {selectedRequest.request_type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Company Name</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.company_name}</p>
              </div>
              <div>
                <label className="form-label">Contact Person</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.contact_person}</p>
              </div>
              <div>
                <label className="form-label">Email</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.email}</p>
              </div>
              <div>
                <label className="form-label">Phone</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.phone_number || '-'}</p>
              </div>
              <div>
                <label className="form-label">Position</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.position}</p>
              </div>
              <div>
                <label className="form-label">Number of Employees</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.number_of_employees}</p>
              </div>
              <div>
                <label className="form-label">Location</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.location || '-'}</p>
              </div>
              <div>
                <label className="form-label">Start Date</label>
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedRequest.start_date
                    ? new Date(selectedRequest.start_date).toLocaleDateString()
                    : '-'}
                </p>
              </div>
            </div>

            {selectedRequest.request_type === 'Special' && (
              <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Special Request Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedRequest.salary_range && (
                    <div>
                      <label className="form-label">Salary Range</label>
                      <p className="text-gray-700 dark:text-gray-300">{selectedRequest.salary_range}</p>
                    </div>
                  )}
                  {selectedRequest.work_city && (
                    <div>
                      <label className="form-label">Work City</label>
                      <p className="text-gray-700 dark:text-gray-300">{selectedRequest.work_city}</p>
                    </div>
                  )}
                  {selectedRequest.urgency && (
                    <div>
                      <label className="form-label">Urgency</label>
                      <p className="text-gray-700 dark:text-gray-300 capitalize">{selectedRequest.urgency}</p>
                    </div>
                  )}
                </div>
                {selectedRequest.required_skills && (
                  <div>
                    <label className="form-label">Required Skills</label>
                    <p className="text-gray-700 dark:text-gray-300">{selectedRequest.required_skills}</p>
                  </div>
                )}
              </div>
            )}

            {selectedRequest.requirements && (
              <div>
                <label className="form-label">Requirements</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.requirements}</p>
              </div>
            )}

            {selectedRequest.notes && (
              <div>
                <label className="form-label">Notes</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.notes}</p>
              </div>
            )}

            <div>
              <label className="form-label">Status</label>
              <p className="text-gray-700 dark:text-gray-300 capitalize">{selectedRequest.status}</p>
            </div>
          </div>
        )}
      </Dialog>

      {/* Candidate Selection Modal */}
      <Dialog isOpen={showCandidateModal} onClose={() => setShowCandidateModal(false)} width={1200} height="90vh">
        <div className="space-y-4 w-full h-full overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-bold">
              Select Candidates for {currentStandardRequest?.company_name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Position: {currentStandardRequest?.position} ({currentStandardRequest?.number_of_employees} employees needed)
            </p>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search candidates by name or skill..."
              value={candidateSearchTerm}
              onChange={(e) => setCandidateSearchTerm(e.target.value)}
            />
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left py-3 px-4 w-12">
                    <Checkbox
                      checked={
                        candidates
                          .filter((c) =>
                            c.name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
                            c.job_category.toLowerCase().includes(candidateSearchTerm.toLowerCase())
                          )
                          .every((c) => selectedCandidates.includes(c.candidate_id)) &&
                        candidates.filter((c) =>
                          c.name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
                          c.job_category.toLowerCase().includes(candidateSearchTerm.toLowerCase())
                        ).length > 0
                      }
                      onChange={(checked) => handleSelectAllCandidates(checked as boolean)}
                    />
                  </th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Job Category</th>
                  <th className="text-left py-3 px-4">Skill Level</th>
                  <th className="text-left py-3 px-4">Education</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {candidates
                  .filter((c) =>
                    c.name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
                    c.job_category.toLowerCase().includes(candidateSearchTerm.toLowerCase())
                  )
                  .map((candidate) => (
                    <tr
                      key={candidate.candidate_id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.candidate_id)}
                          onChange={(checked) =>
                            handleSelectCandidate(candidate.candidate_id, checked as boolean)
                          }
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        {candidate.name}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {candidate.job_category}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {candidate.skill_level}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {candidate.education_level}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${
                            candidate.status === 'available'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {candidates.filter((c) =>
              c.name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
              c.job_category.toLowerCase().includes(candidateSearchTerm.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No candidates found
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => setShowCandidateModal(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmCandidateSelection}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Selection ({selectedCandidates.length})
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  )
}

export default EmployeeRequest
