import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Checkbox from '@/components/ui/Checkbox'
import Pagination from '@/components/ui/Pagination'
import Tag from '@/components/ui/Tag'
import { notify } from '@/utils/notification'
import { apiCreateNotification } from '@/services/CommonService'
import { useSessionUser } from '@/store/authStore'

interface SpecialRequest {
  request_id: string
  request_type: string
  company_name: string
  position: string
  number_of_employees: number
  status: string
  start_date: string
  created_at: string
  description?: string
  requirements?: string
  budget?: string
  candidate_ids?: string[]
  candidates_data?: Array<{
    id: number
    candidate_id: string
    name: string
    job_category?: string
    skill_level?: string
  }>
}

const REQUEST_TYPES = ['Standard', 'Special', 'Urgent', 'Contract']
const REQUEST_STATUSES = ['Pending', 'In Progress', 'Approved', 'Completed', 'Rejected']

const SpecialRequest = () => {
  const { user } = useSessionUser((state) => state)
  const [requests, setRequests] = useState<SpecialRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<SpecialRequest[]>([])
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<SpecialRequest>>({})
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRequests, setTotalRequests] = useState(0)
  const [companyName, setCompanyName] = useState('')
  const [formData, setFormData] = useState({
    company_name: '',
    position: '',
    request_type: 'Standard',
    number_of_employees: 1,
    description: '',
    requirements: '',
    budget: '',
  })
  const pageSize = 10

  useEffect(() => {
    fetchRequests(currentPage)
  }, [currentPage])

  // Fetch company info when modal opens
  useEffect(() => {
    if (showAddModal && user.partnershipId) {
      const fetchCompanyInfo = async () => {
        try {
          const response = await fetch(`/api/partnerships/${user.partnershipId}`)
          if (response.ok) {
            const data = await response.json()
            const name = data.data?.company_name || data.company_name || ''
            setCompanyName(name)
            setFormData((prev) => ({ ...prev, company_name: name }))
          }
        } catch (error) {
          console.error('Error fetching company info:', error)
        }
      }
      fetchCompanyInfo()
    }
  }, [showAddModal, user.partnershipId])

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

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (Object.keys(filters).length > 0) {
      filtered = filtered.filter((r) => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true
          const requestValue = r[key as keyof SpecialRequest]
          if (typeof requestValue === 'string') {
            return requestValue.toLowerCase().includes(String(value).toLowerCase())
          }
          return requestValue === value
        })
      })
    }

    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn as keyof SpecialRequest]
        const bValue = b[sortColumn as keyof SpecialRequest]

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
  }, [requests, searchTerm, filters, sortColumn, sortDirection])

  const fetchRequests = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/special-requests?page=${page}&limit=${pageSize}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const text = await response.text()
      if (!text) {
        console.warn('Empty response from /api/special-requests')
        setRequests([])
        notify.error('Error', 'Empty response from server')
        return
      }
      const data = JSON.parse(text)
      if (data.success) {
        setRequests(data.data || [])
        setTotalRequests(data.total || 0)
      } else {
        console.error('API returned success: false', data)
        setRequests([])
        notify.error('Error', data.message || 'Failed to fetch requests')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error fetching requests:', error)
      setRequests([])
      notify.error('Fetch Error', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRequest = async () => {
    if (!formData.company_name || !formData.position) {
      notify.error('Validation Error', 'Please fill in required fields')
      return
    }

    try {
      const response = await fetch('/api/special-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.company_name,
          position: formData.position,
          number_of_employees: formData.number_of_employees,
          requirements: formData.requirements,
          notes: formData.description,
          salary_range: formData.budget,
          contact_person: 'User',
          email: 'user@example.com',
          phone_number: '',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create request')
      }

      const responseData = await response.json()
      const requestId = responseData.data?.request_id

      // Send notification to admin about the special request
      try {
        const adminResponse = await fetch('/api/users/admin-users')
        if (adminResponse.ok) {
          const adminData = await adminResponse.json()
          if (adminData.data && adminData.data.length > 0) {
            const adminUserId = adminData.data[0].user_id
            await apiCreateNotification({
              target: 'Special Request',
              description: `New special request for ${formData.position} position from ${formData.company_name}`,
              type: 1,
              location: 'special-request',
              locationLabel: 'Special Request',
              status: 'Pending',
              user_id: adminUserId,
              related_entity_id: requestId,
              related_entity_type: 'special_request',
            })
          }
        }
      } catch (notifError) {
        console.error('Failed to create notification:', notifError)
      }

      notify.success('Success', 'Special request created successfully')
      setFormData({
        company_name: '',
        position: '',
        request_type: 'Standard',
        number_of_employees: 1,
        description: '',
        requirements: '',
        budget: '',
      })
      setShowAddModal(false)
      setCurrentPage(1)
      fetchRequests(1)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      notify.error('Error', errorMsg)
    }
  }

  const handleDownload = () => {
    const headers = ['Company', 'Position', 'Type', 'Positions', 'Status', 'Start Date']
    const csv = [
      headers,
      ...filteredRequests.map((r) => [
        r.company_name,
        r.position,
        r.request_type,
        r.number_of_employees,
        r.status,
        new Date(r.start_date || r.created_at).toLocaleDateString('en-US'),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'special-requests.csv'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-200'
      case 'In Progress':
        return 'bg-sky-200'
      case 'Pending':
        return 'bg-yellow-200'
      case 'Completed':
        return 'bg-purple-200'
      case 'Rejected':
        return 'bg-red-200'
      default:
        return 'bg-gray-200'
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h3 className="text-xl font-bold">Special Requests</h3>
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
            <Button onClick={() => setShowAddModal(true)}>
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
                    <path d="M12 5l0 14"></path>
                    <path d="M5 12l14 0"></path>
                  </svg>
                </span>
                <span>New Request</span>
              </span>
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="input-wrapper relative flex-1">
            <Input
              placeholder="Search by company or position..."
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
                      selectedRequests.length === filteredRequests.length &&
                      filteredRequests.length > 0
                    }
                    onChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('company_name')}
                >
                  Company
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('position')}
                >
                  Position
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('request_type')}
                >
                  Type
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('number_of_employees')}
                >
                  Positions
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('status')}
                >
                  Status
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                  onClick={() => handleSort('start_date')}
                >
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr
                    key={request.request_id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4 w-12">
                      <Checkbox
                        checked={selectedRequests.includes(request.request_id)}
                        onChange={(checked) => handleSelectRequest(request.request_id, checked as boolean)}
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold">{request.company_name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{request.position}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{request.request_type}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{request.number_of_employees}</td>
                    <td className="py-3 px-4">
                      <Tag className={getStatusColor(request.status)}>{request.status}</Tag>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {new Date(request.start_date || request.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredRequests.length} of {totalRequests} results
          </div>
          {totalRequests > 0 && (
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              total={totalRequests}
              onChange={(page) => setCurrentPage(page)}
            />
          )}
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
              {REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
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
              {REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => setShowFilterModal(false)}>Close</Button>
            <Button onClick={() => { setFilters({}); setShowFilterModal(false); }}>
              Reset Filters
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add Request Modal */}
      <Dialog isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="mb-4">
          <h2 className="text-lg font-bold">Create New Special Request</h2>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="form-label">Company Name</label>
            <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100">
              {companyName || 'Loading...'}
            </div>
          </div>

          <div>
            <label className="form-label">Position *</label>
            <Input
              placeholder="Enter position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Request Type</label>
            <select
              value={formData.request_type}
              onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Number of Positions</label>
            <Input
              type="number"
              placeholder="Enter number of positions"
              value={formData.number_of_employees}
              onChange={(e) => setFormData({ ...formData, number_of_employees: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              placeholder="Enter job description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
            />
          </div>

          <div>
            <label className="form-label">Requirements</label>
            <Input
              placeholder="Enter job requirements"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Budget</label>
            <Input
              placeholder="Enter budget"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddRequest}>Create Request</Button>
          </div>
        </div>
      </Dialog>
    </Card>
  )
}

export default SpecialRequest
