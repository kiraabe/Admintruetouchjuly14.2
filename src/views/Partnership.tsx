import { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import Pagination from '@/components/ui/Pagination'
import Checkbox from '@/components/ui/Checkbox'
import Dialog from '@/components/ui/Dialog'
import Select from '@/components/ui/Select'
import { toast } from 'sonner'

interface Partnership {
  id: number
  partner_id: string
  company_name: string
  company_logo: string | null
  business_email: string
  business_category: string
  license_number: string
  license_document: string | null
  contact_person_name: string
  phone_number: string
  service_city: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
}

const Partnership = () => {
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPartnerships, setSelectedPartnerships] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingPartner, setEditingPartner] = useState<Partnership | null>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    business_email: '',
    business_category: 'Agency',
    license_number: '',
    contact_person_name: '',
    phone_number: '',
    service_city: '',
    status: 'pending',
  })
  const [files, setFiles] = useState<{
    companyLogo: File | null
    licenseDocument: File | null
  }>({
    companyLogo: null,
    licenseDocument: null,
  })

  const businessCategories = ['Agency', 'Recruitment', 'Referral', 'Other']
  const serviceCities = [
    'Dubai',
    'Abu Dhabi',
    'Sharjah',
    'Ajman',
    'Umm Al Quwain',
    'Ras Al Khaimah',
    'Fujairah',
  ]

  useEffect(() => {
    fetchPartnerships()
  }, [])

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        const dialogElement = document.querySelector('.dialog')
        if (dialogElement) {
          const rect = dialogElement.getBoundingClientRect()
          window.scrollBy({
            top: rect.top - window.innerHeight / 2 + rect.height / 2,
            behavior: 'smooth',
          })
        }
      }, 100)
    }
  }, [isModalOpen])

  const fetchPartnerships = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/partnerships')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setPartnerships(result.data || [])
      } else {
        toast.error(result.error || 'Failed to load partnerships')
      }
    } catch (error) {
      console.error('Error fetching partnerships:', error)
      toast.error('Failed to load partnerships')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPartnerships(partnerships.map((p) => p.partner_id))
    } else {
      setSelectedPartnerships([])
    }
  }

  const handleSelectPartnership = (partnerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPartnerships([...selectedPartnerships, partnerId])
    } else {
      setSelectedPartnerships(selectedPartnerships.filter((id) => id !== partnerId))
    }
  }

  const handleOpenModal = (partner?: Partnership) => {
    if (partner) {
      setEditingPartner(partner)
      setFormData({
        company_name: partner.company_name,
        business_email: partner.business_email,
        business_category: partner.business_category,
        license_number: partner.license_number,
        contact_person_name: partner.contact_person_name,
        phone_number: partner.phone_number,
        service_city: partner.service_city,
        status: partner.status,
      })
    } else {
      setEditingPartner(null)
      setFormData({
        company_name: '',
        business_email: '',
        business_category: 'Agency',
        license_number: '',
        contact_person_name: '',
        phone_number: '',
        service_city: 'Dubai',
        status: 'pending',
      })
    }
    setFiles({ companyLogo: null, licenseDocument: null })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPartner(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.company_name || !formData.business_email || !formData.business_category ||
        !formData.license_number || !formData.contact_person_name || !formData.phone_number ||
        !formData.service_city) {
      toast.error('Please fill in all required fields')
      return
    }

    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value as string)
    })

    if (files.companyLogo) {
      formDataObj.append('companyLogo', files.companyLogo)
    }
    if (files.licenseDocument) {
      formDataObj.append('licenseDocument', files.licenseDocument)
    }

    try {
      const url = editingPartner ? `/api/partnerships/${editingPartner.partner_id}` : '/api/partnerships'
      const method = editingPartner ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: formDataObj,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        toast.success(editingPartner ? 'Partnership updated' : 'Partnership created')
        handleCloseModal()
        await fetchPartnerships()
      } else {
        toast.error(result.error || 'Failed to save partnership')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save partnership'
      console.error('Error saving partnership:', error)
      toast.error(errorMsg)
    }
  }

  const handleDelete = async (partnerId: string) => {
    if (!confirm('Are you sure you want to delete this partnership?')) return

    try {
      const response = await fetch(`/api/partnerships/${partnerId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        toast.success('Partnership deleted')
        await fetchPartnerships()
      } else {
        toast.error(result.error || 'Failed to delete partnership')
      }
    } catch (error) {
      console.error('Error deleting partnership:', error)
      toast.error('Failed to delete partnership')
    }
  }

  const handleDownload = () => {
    if (partnerships.length === 0) {
      toast.error('No partnerships to download')
      return
    }

    const csv = [
      ['Company', 'Email', 'Category', 'License', 'Contact', 'Phone', 'City', 'Status'],
      ...partnerships.map((p) => [
        p.company_name,
        p.business_email,
        p.business_category,
        p.license_number,
        p.contact_person_name,
        p.phone_number,
        p.service_city,
        p.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'partnerships.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-200'
      case 'pending':
        return 'bg-orange-200'
      case 'inactive':
        return 'bg-red-200'
      default:
        return 'bg-gray-200'
    }
  }

  const filteredPartnerships = partnerships.filter(
    (partner) =>
      partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.business_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.service_city.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h3 className="text-xl font-bold">Partnership</h3>
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
            <Button variant="primary" onClick={() => handleOpenModal()}>
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
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading partnerships...</div>
        ) : filteredPartnerships.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {partnerships.length === 0 ? 'No partnerships yet' : 'No results found'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 w-12">
                      <Checkbox
                        checked={
                          selectedPartnerships.length === filteredPartnerships.length &&
                          filteredPartnerships.length > 0
                        }
                        onChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      Company
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      City
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      Status
                    </th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartnerships.map((partner) => (
                    <tr
                      key={partner.partner_id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-4 w-12">
                        <Checkbox
                          checked={selectedPartnerships.includes(partner.partner_id)}
                          onChange={(checked) =>
                            handleSelectPartnership(partner.partner_id, checked as boolean)
                          }
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {partner.company_logo && (
                            <img
                              src={partner.company_logo}
                              alt={partner.company_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <a
                            href="#"
                            className="hover:text-primary font-semibold text-gray-900 dark:text-gray-100"
                          >
                            {partner.company_name}
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {partner.business_email}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {partner.business_category}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {partner.contact_person_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {partner.service_city}
                      </td>
                      <td className="py-3 px-4">
                        <Tag className={`${getStatusColor(partner.status)} text-gray-900`}>
                          {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                        </Tag>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleOpenModal(partner)}
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
                            onClick={() => handleDelete(partner.partner_id)}
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredPartnerships.length} of {partnerships.length} results
              </div>
              <Pagination />
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog isOpen={isModalOpen} onClose={handleCloseModal} title="Add Partnership" size="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Business Identity */}
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-3">Business Identity</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <Input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Legal company name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Email</label>
                <Input
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                  placeholder="official@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Category</label>
                <Select
                  options={businessCategories.map((cat) => ({ value: cat, label: cat }))}
                  value={{ value: formData.business_category, label: formData.business_category }}
                  onChange={(val) =>
                    setFormData({ ...formData, business_category: val?.value || 'Agency' })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFiles({ ...files, companyLogo: e.target.files?.[0] || null })
                  }
                  className="block w-full text-sm border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Legal & Compliance */}
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-3">Legal & Compliance</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">License Number</label>
                <Input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="Unique business permit ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Document</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) =>
                    setFiles({ ...files, licenseDocument: e.target.files?.[0] || null })
                  }
                  className="block w-full text-sm border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-3">Contact Person</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input
                  type="text"
                  value={formData.contact_person_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_person_name: e.target.value })
                  }
                  placeholder="Contact person name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <Input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+971 50 123 4567"
                  required
                />
              </div>
            </div>
          </div>

          {/* Operational Details */}
          <div className="pb-4">
            <h4 className="font-semibold mb-3">Operational Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Service City</label>
                <Select
                  options={serviceCities.map((city) => ({ value: city, label: city }))}
                  value={formData.service_city ? { value: formData.service_city, label: formData.service_city } : null}
                  onChange={(val) => setFormData({ ...formData, service_city: val?.value || '' })}
                  placeholder="Select a city"
                  isClearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  value={{ value: formData.status, label: formData.status.charAt(0).toUpperCase() + formData.status.slice(1) }}
                  onChange={(val) => setFormData({ ...formData, status: val?.value as 'pending' | 'active' | 'inactive' || 'pending' })}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="default" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingPartner ? 'Update Partnership' : 'Create Partnership'}
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  )
}

export default Partnership
