import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import { toast } from 'sonner'

interface License {
  id: string
  license_number: string
  company_name: string
  business_type: string
  issue_date: string
  expiry_date: string
  status: 'active' | 'expired' | 'pending' | 'suspended'
  document_url: string | null
  issued_by: string
  notes: string | null
  created_at: string
  updated_at: string
}

const LicenseInfo = () => {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [formData, setFormData] = useState({
    license_number: '',
    company_name: '',
    business_type: '',
    issue_date: '',
    expiry_date: '',
    status: 'pending',
    issued_by: '',
    notes: '',
  })

  useEffect(() => {
    fetchLicenses()
  }, [])

  const fetchLicenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/licenses')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setLicenses(data.data || [])
      } else {
        toast.error(data.error || 'Failed to load licenses')
      }
    } catch (error) {
      console.error('Error fetching licenses:', error)
      toast.error('Failed to load licenses')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setFormData({
      license_number: '',
      company_name: '',
      business_type: '',
      issue_date: '',
      expiry_date: '',
      status: 'pending',
      issued_by: '',
      notes: '',
    })
    setSelectedLicense(null)
    setShowAddModal(true)
  }

  const handleEdit = (license: License) => {
    setSelectedLicense(license)
    setFormData({
      license_number: license.license_number,
      company_name: license.company_name,
      business_type: license.business_type,
      issue_date: license.issue_date,
      expiry_date: license.expiry_date,
      status: license.status,
      issued_by: license.issued_by,
      notes: license.notes || '',
    })
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!formData.license_number || !formData.company_name) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      if (selectedLicense) {
        const response = await fetch(`/api/licenses/${selectedLicense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!response.ok) throw new Error('Failed to update license')
        toast.success('License updated successfully')
        setShowEditModal(false)
      } else {
        const response = await fetch('/api/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!response.ok) throw new Error('Failed to create license')
        toast.success('License added successfully')
        setShowAddModal(false)
      }
      fetchLicenses()
    } catch (error) {
      toast.error('Failed to save license')
    }
  }

  const handleDelete = async (licenseId: string) => {
    if (!confirm('Are you sure you want to delete this license?')) return

    try {
      const response = await fetch(`/api/licenses/${licenseId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete license')
      toast.success('License deleted successfully')
      fetchLicenses()
    } catch (error) {
      toast.error('Failed to delete license')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-200'
      case 'expired':
        return 'bg-red-200'
      case 'pending':
        return 'bg-orange-200'
      case 'suspended':
        return 'bg-yellow-200'
      default:
        return 'bg-gray-200'
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h3 className="text-xl font-bold">License Information</h3>
          <Button variant="primary" onClick={handleAddNew}>
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
              <span>Add License</span>
            </span>
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading licenses...</div>
        ) : licenses.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No licenses found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4">License Number</th>
                  <th className="text-left py-3 px-4">Company Name</th>
                  <th className="text-left py-3 px-4">Business Type</th>
                  <th className="text-left py-3 px-4">Issue Date</th>
                  <th className="text-left py-3 px-4">Expiry Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Issued By</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr
                    key={license.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                      {license.license_number}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {license.company_name}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {license.business_type}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {new Date(license.issue_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {new Date(license.expiry_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(license.status)} text-gray-900`}>
                        {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {license.issued_by}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(license)}
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
                          onClick={() => handleDelete(license.id)}
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
      </div>

      {/* Add License Modal */}
      <Dialog isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="mb-4">
          <h2 className="text-lg font-bold">Add New License</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="form-label">License Number *</label>
            <Input
              placeholder="Enter license number"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Company Name *</label>
            <Input
              placeholder="Enter company name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Business Type</label>
            <Input
              placeholder="Enter business type"
              value={formData.business_type}
              onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Issue Date</label>
            <Input
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Expiry Date</label>
            <Input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="form-label">Issued By</label>
            <Input
              placeholder="Enter issuing authority"
              value={formData.issued_by}
              onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <Input
              placeholder="Enter any notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              Save License
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit License Modal */}
      <Dialog isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="mb-4">
          <h2 className="text-lg font-bold">Edit License</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="form-label">License Number *</label>
            <Input
              placeholder="Enter license number"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Company Name *</label>
            <Input
              placeholder="Enter company name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Business Type</label>
            <Input
              placeholder="Enter business type"
              value={formData.business_type}
              onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Issue Date</label>
            <Input
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Expiry Date</label>
            <Input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="form-label">Issued By</label>
            <Input
              placeholder="Enter issuing authority"
              value={formData.issued_by}
              onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <Input
              placeholder="Enter any notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              Update License
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  )
}

export default LicenseInfo
