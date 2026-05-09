import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
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

const EditPartnership = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNewPartnership = id === 'new'
  const [partnership, setPartnership] = useState<Partnership | null>(null)
  const [loading, setLoading] = useState(!isNewPartnership)
  const [companyLogoPreview, setCompanyLogoPreview] = useState('')
  const [companyLogo, setCompanyLogo] = useState<File | null>(null)
  const [licenseDocument, setLicenseDocument] = useState<File | null>(null)

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
    if (!isNewPartnership) {
      fetchPartnership()
    }
  }, [id])

  const fetchPartnership = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/partnerships/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch partnership')
      }
      const data = await response.json()
      if (data.success) {
        const partner = data.data
        setPartnership(partner)
        setFormData({
          company_name: partner.company_name || '',
          business_email: partner.business_email || '',
          business_category: partner.business_category || 'Agency',
          license_number: partner.license_number || '',
          contact_person_name: partner.contact_person_name || '',
          phone_number: partner.phone_number || '',
          service_city: partner.service_city || '',
          status: partner.status || 'pending',
        })
        if (partner.company_logo) {
          setCompanyLogoPreview(partner.company_logo)
        }
      } else {
        toast.error('Failed to load partnership')
        navigate('/partnership')
      }
    } catch (error) {
      console.error('Error fetching partnership:', error)
      toast.error('Failed to load partnership')
      navigate('/partnership')
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Maximum 5MB allowed')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      setCompanyLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCompanyLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLicenseDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum 10MB allowed')
        return
      }
      setLicenseDocument(file)
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.company_name || !formData.business_email || !formData.license_number) {
      toast.error('Please fill in all required fields')
      return
    }

    const toastId = toast.loading(isNewPartnership ? 'Creating partnership...' : 'Updating partnership...')

    try {
      const formDataToSend = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, String(value))
        }
      })

      if (companyLogo) {
        formDataToSend.append('companyLogo', companyLogo)
      }

      if (licenseDocument) {
        formDataToSend.append('licenseDocument', licenseDocument)
      }

      if (isNewPartnership) {
        const response = await fetch('/api/partnerships', {
          method: 'POST',
          body: formDataToSend,
        })

        const data = await response.json()
        if (response.ok) {
          toast.dismiss(toastId)
          toast.success('Partnership created successfully')
          setTimeout(() => navigate('/partnership'), 500)
        } else {
          toast.dismiss(toastId)
          const errorMsg = data.error || 'Failed to create partnership'
          toast.error(errorMsg)
        }
      } else {
        const response = await fetch(`/api/partnerships/${partnership?.partner_id}`, {
          method: 'PUT',
          body: formDataToSend,
        })

        const data = await response.json()
        if (response.ok) {
          toast.dismiss(toastId)
          toast.success('Partnership updated successfully')
          setTimeout(() => navigate('/partnership'), 500)
        } else {
          toast.dismiss(toastId)
          const errorMsg = data.error || 'Failed to update partnership'
          toast.error(errorMsg)
        }
      }
    } catch (error) {
      toast.dismiss(toastId)
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error saving partnership:', error)
      toast.error(errorMsg)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this partnership?')) return

    try {
      toast.loading('Deleting partnership...')
      const response = await fetch(`/api/partnerships/${partnership?.partner_id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.error || 'Failed to delete partnership'
        toast.error(errorMsg)
        return
      }

      toast.success('Partnership deleted successfully')
      setTimeout(() => navigate('/partnership'), 500)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error deleting partnership:', error)
      toast.error(errorMsg)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading partnership...</p>
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
            <h3 className="font-bold text-xl">
              {isNewPartnership ? 'Add New Partnership' : 'Edit Partnership'}
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full h-full">
          <div className="form-container vertical flex flex-col w-full justify-between">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left Column - Form Fields */}
                <div className="gap-4 flex flex-col flex-auto">
                  {/* Business Identity Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">Business Identity</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label mb-2">Company Name *</label>
                          <Input
                            value={formData.company_name}
                            onChange={(e) => handleFieldChange('company_name', e.target.value)}
                            placeholder="Legal company name"
                            required
                          />
                        </div>

                        <div>
                          <label className="form-label mb-2">Business Email *</label>
                          <Input
                            type="email"
                            value={formData.business_email}
                            onChange={(e) => handleFieldChange('business_email', e.target.value)}
                            placeholder="official@company.com"
                            required
                          />
                        </div>

                        <div>
                          <label className="form-label mb-2">Business Category</label>
                          <select
                            value={formData.business_category}
                            onChange={(e) => handleFieldChange('business_category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
                          >
                            {businessCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div></div>
                      </div>
                    </div>
                  </Card>

                  {/* Legal & Compliance Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">Legal & Compliance</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label mb-2">License Number *</label>
                          <Input
                            value={formData.license_number}
                            onChange={(e) => handleFieldChange('license_number', e.target.value)}
                            placeholder="Unique business permit ID"
                            required
                          />
                        </div>

                        <div></div>
                      </div>
                    </div>
                  </Card>

                  {/* Contact Person Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">Contact Person</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label mb-2">Full Name</label>
                          <Input
                            value={formData.contact_person_name}
                            onChange={(e) => handleFieldChange('contact_person_name', e.target.value)}
                            placeholder="Contact person name"
                          />
                        </div>

                        <div>
                          <label className="form-label mb-2">Phone Number</label>
                          <Input
                            type="tel"
                            value={formData.phone_number}
                            onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                            placeholder="+971 50 123 4567"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Operational Details Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">Operational Details</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label mb-2">Service City</label>
                          <select
                            value={formData.service_city}
                            onChange={(e) => handleFieldChange('service_city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
                          >
                            <option value="">Select city</option>
                            {serviceCities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label mb-2">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                status: e.target.value as 'pending' | 'active' | 'inactive',
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-12"
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Column - Files & Info */}
                <div className="md:w-[370px] gap-4 flex flex-col">
                  {/* Company Logo Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">Company Logo</h4>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg text-center p-4">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden border-4 border-white dark:border-gray-600 bg-gray-200 dark:bg-gray-600">
                            {companyLogoPreview ? (
                              <img
                                src={companyLogoPreview}
                                alt="Company logo preview"
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
                                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="upload">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCompanyLogoChange}
                            className="hidden"
                            id="companyLogoInput"
                          />
                          <label htmlFor="companyLogoInput">
                            <Button
                              type="button"
                              onClick={() => document.getElementById('companyLogoInput')?.click()}
                            >
                              Upload Logo
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* License Document Section */}
                  <Card className="card-border">
                    <div className="card-body">
                      <h4 className="mb-6 font-semibold">License Document</h4>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                        <div className="mb-4">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,image/*"
                            onChange={handleLicenseDocumentChange}
                            className="hidden"
                            id="licenseDocumentInput"
                          />
                          <label htmlFor="licenseDocumentInput">
                            <Button
                              type="button"
                              onClick={() => document.getElementById('licenseDocumentInput')?.click()}
                            >
                              Upload Document
                            </Button>
                          </label>
                        </div>
                        {licenseDocument && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Selected: {licenseDocument.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Partnership Info */}
                  {!isNewPartnership && partnership && (
                    <Card className="card-border">
                      <div className="card-body">
                        <h4 className="mb-4 font-semibold">Partnership Info</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">ID</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Partner ID</p>
                            </div>
                            <span className="text-sm font-mono">{partnership.partner_id}</span>
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div>
                              <p className="font-semibold text-sm">Created</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {partnership.created_at
                                  ? new Date(partnership.created_at).toLocaleDateString()
                                  : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div>
                              <p className="font-semibold text-sm">Updated</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {partnership.updated_at
                                  ? new Date(partnership.updated_at).toLocaleDateString()
                                  : '-'}
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
                    onClick={() => navigate('/partnership')}
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
                    {!isNewPartnership && (
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
                    <Button type="submit">{isNewPartnership ? 'Create' : 'Save'}</Button>
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

export default EditPartnership
