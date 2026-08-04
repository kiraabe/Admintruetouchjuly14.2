import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Pagination from '@/components/ui/Pagination'
import { useSessionUser } from '@/store/authStore'
import ApiService from '@/services/ApiService'

interface StandardRequest {
  request_id: string
  company_name: string
  contact_person: string
  email: string
  phone_number?: string
  position: string
  number_of_employees: number
  status: string
  start_date?: string
  location?: string
  requirements?: string
  notes?: string
  salary_range?: string
  required_skills?: string
  work_city?: string
  urgency?: string
  created_at: string
  updated_at: string
  candidates?: Array<{
    candidate_id: string
    name: string
    job_category?: string
  }>
}

const REQUEST_STATUSES = ['Pending', 'In Progress', 'Approved', 'Completed', 'Rejected']

const StandardRequestsHistory = () => {
  const { user } = useSessionUser((state) => state)
  const [requests, setRequests] = useState<StandardRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<StandardRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRequests, setTotalRequests] = useState(0)
  const [selectedRequest, setSelectedRequest] = useState<StandardRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const pageSize = 10

  useEffect(() => {
    fetchRequests(currentPage)
  }, [currentPage])

  useEffect(() => {
    filterRequests()
  }, [searchTerm, statusFilter, requests])

  const fetchRequests = async (page: number) => {
    try {
      setLoading(true)
      const data = await ApiService.fetchDataWithAxios<any>({
        method: 'GET',
        url: '/standard-requests',
        params: {
          page,
          limit: pageSize,
        },
      })

      if (data.data) {
        setRequests(data.data || [])
        setTotalRequests(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching standard requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterRequests = () => {
    let filtered = requests

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }

    setFilteredRequests(filtered)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in progress':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-emerald-100 text-emerald-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewDetails = async (request: StandardRequest) => {
    try {
      const data = await ApiService.fetchDataWithAxios<any>({
        method: 'GET',
        url: `/standard-requests/${request.request_id}`,
      })
      setSelectedRequest({
        ...request,
        candidates: data.data?.candidates || [],
      })
    } catch (error) {
      console.error('Error loading request candidates:', error)
      setSelectedRequest(request)
    }
    setShowDetailModal(true)
  }

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const totalPages = Math.ceil(filteredRequests.length / pageSize)

  if (showDetailModal && selectedRequest) {
    return (
      <Card>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h1 className="text-2xl font-bold">Request Details</h1>
              <p className="text-sm text-gray-500 mt-1">Standard request</p>
            </div>
            <Button onClick={() => setShowDetailModal(false)}>Back to Requests</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['Company', selectedRequest.company_name],
              ['Contact Person', selectedRequest.contact_person],
              ['Email', selectedRequest.email],
              ['Phone', selectedRequest.phone_number || 'N/A'],
              ['Position', selectedRequest.position],
              ['Employees', String(selectedRequest.number_of_employees)],
              ['Location', selectedRequest.location || 'N/A'],
              ['Requested Date', new Date(selectedRequest.created_at).toLocaleDateString()],
              ['Start Date', selectedRequest.start_date ? new Date(selectedRequest.start_date).toLocaleDateString() : 'N/A'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
                <label className="font-semibold text-gray-600 dark:text-gray-400">{label}</label>
                <p className="mt-1">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="font-semibold text-gray-600 dark:text-gray-400">Status</label>
            <p className="mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(selectedRequest.status)}`}>
                {selectedRequest.status}
              </span>
            </p>
          </div>

          {selectedRequest.candidates && selectedRequest.candidates.length > 0 ? (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <h2 className="font-semibold mb-3">Candidates ({selectedRequest.candidates.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedRequest.candidates.map((candidate) => (
                  <div key={candidate.candidate_id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <p className="font-medium">{candidate.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {candidate.job_category || 'No category'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="border-t border-gray-200 dark:border-gray-700 pt-5 text-gray-500">
              No candidates have been selected for this request.
            </p>
          )}

          {selectedRequest.requirements && (
            <div>
              <label className="font-semibold text-gray-600 dark:text-gray-400">Requirements</label>
              <p className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm whitespace-pre-wrap">
                {selectedRequest.requirements}
              </p>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Standard Requests History</h1>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by company, position, or contact person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Statuses</option>
            {REQUEST_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading requests...</div>
      ) : paginatedRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {requests.length === 0 ? 'No standard requests found' : 'No requests match your filters'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Company</th>
                  <th className="px-4 py-3 text-left font-semibold">Contact Person</th>
                  <th className="px-4 py-3 text-left font-semibold">Position</th>
                  <th className="px-4 py-3 text-left font-semibold">Employees</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((request) => (
                  <tr key={request.request_id} className="border-b dark:border-gray-700">
                    <td className="px-4 py-3 font-medium">{request.company_name}</td>
                    <td className="px-4 py-3">{request.contact_person}</td>
                    <td className="px-4 py-3">{request.position}</td>
                    <td className="px-4 py-3">{request.number_of_employees}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                        className="text-xs"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Dialog
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        width={700}
      >
        {selectedRequest && (
          <div>
            <h2 className="text-lg font-bold mb-4">Request Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Company</label>
                  <p>{selectedRequest.company_name}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Contact Person</label>
                  <p>{selectedRequest.contact_person}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Email</label>
                  <p>{selectedRequest.email}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Phone</label>
                  <p>{selectedRequest.phone_number || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Position</label>
                  <p>{selectedRequest.position}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Number of Employees</label>
                  <p>{selectedRequest.number_of_employees}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Status</label>
                  <p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Start Date</label>
                  <p>{selectedRequest.start_date ? new Date(selectedRequest.start_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              {selectedRequest.location && (
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Location</label>
                  <p>{selectedRequest.location}</p>
                </div>
              )}

              {selectedRequest.requirements && (
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Requirements</label>
                  <p className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedRequest.requirements}
                  </p>
                </div>
              )}

              {selectedRequest.candidates && selectedRequest.candidates.length > 0 && (
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Candidates ({selectedRequest.candidates.length})</label>
                  <div className="space-y-2">
                    {selectedRequest.candidates.map((candidate) => (
                      <div key={candidate.candidate_id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="font-medium">{candidate.name}</p>
                        {candidate.job_category && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">{candidate.job_category}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Created</label>
                  <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Updated</label>
                  <p>{new Date(selectedRequest.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Dialog>
    </Card>
  )
}

export default StandardRequestsHistory
