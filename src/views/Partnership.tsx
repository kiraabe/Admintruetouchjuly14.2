import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import Pagination from '@/components/ui/Pagination'
import Checkbox from '@/components/ui/Checkbox'

interface Partner {
  id: number
  name: string
  email: string
  partnerType: string
  status: 'active' | 'inactive' | 'pending'
  revenue: string
  avatar: string
}

const Partnership = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPartners, setSelectedPartners] = useState<number[]>([])

  const partners: Partner[] = [
    {
      id: 1,
      name: 'Tech Solutions Inc',
      email: 'contact@techsolutions.com',
      partnerType: 'Technology',
      status: 'active',
      revenue: '$125,000',
      avatar: '/img/avatars/thumb-1.jpg',
    },
    {
      id: 2,
      name: 'Global Marketing Group',
      email: 'hello@globalmarketing.com',
      partnerType: 'Marketing',
      status: 'active',
      revenue: '$98,500',
      avatar: '/img/avatars/thumb-2.jpg',
    },
    {
      id: 3,
      name: 'Enterprise Consulting',
      email: 'info@enterprise-consulting.io',
      partnerType: 'Consulting',
      status: 'pending',
      revenue: '$0',
      avatar: '/img/avatars/thumb-3.jpg',
    },
    {
      id: 4,
      name: 'Cloud Services Ltd',
      email: 'support@cloudservices.co.uk',
      partnerType: 'Cloud Provider',
      status: 'active',
      revenue: '$234,750',
      avatar: '/img/avatars/thumb-4.jpg',
    },
    {
      id: 5,
      name: 'Data Analytics Pro',
      email: 'team@dataanalyticspro.io',
      partnerType: 'Data Services',
      status: 'active',
      revenue: '$67,300',
      avatar: '/img/avatars/thumb-5.jpg',
    },
    {
      id: 6,
      name: 'Design Studios',
      email: 'hello@designstudios.io',
      partnerType: 'Design',
      status: 'inactive',
      revenue: '$45,200',
      avatar: '/img/avatars/thumb-6.jpg',
    },
    {
      id: 7,
      name: 'Integration Experts',
      email: 'partners@integrationexperts.com',
      partnerType: 'Integration',
      status: 'active',
      revenue: '$156,800',
      avatar: '/img/avatars/thumb-7.jpg',
    },
    {
      id: 8,
      name: 'Security Solutions',
      email: 'business@securitysolutions.io',
      partnerType: 'Security',
      status: 'pending',
      revenue: '$0',
      avatar: '/img/avatars/thumb-8.jpg',
    },
    {
      id: 9,
      name: 'Mobile Development Co',
      email: 'sales@mobiledev.com',
      partnerType: 'Development',
      status: 'active',
      revenue: '$89,600',
      avatar: '/img/avatars/thumb-9.jpg',
    },
    {
      id: 10,
      name: 'Infrastructure Partners',
      email: 'partnerships@infra-partners.co',
      partnerType: 'Infrastructure',
      status: 'active',
      revenue: '$312,400',
      avatar: '/img/avatars/thumb-10.jpg',
    },
  ]

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPartners(partners.map((p) => p.id))
    } else {
      setSelectedPartners([])
    }
  }

  const handleSelectPartner = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedPartners([...selectedPartners, id])
    } else {
      setSelectedPartners(selectedPartners.filter((pid) => pid !== id))
    }
  }

  const handleDownload = () => {
    const csv = [
      ['Name', 'Email', 'Partner Type', 'Status', 'Revenue'],
      ...partners.map((p) => [p.name, p.email, p.partnerType, p.status, p.revenue]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'partnershipList.csv'
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

  const filteredPartners = partners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.partnerType.toLowerCase().includes(searchTerm.toLowerCase()),
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
            <Button variant="primary">
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
          <div className="input-wrapper relative">
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
          <button className="button bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-700 ring-primary dark:ring-white hover:border-primary dark:hover:border-white hover:ring-1 hover:text-primary dark:hover:text-white dark:hover:bg-transparent text-gray-600 dark:text-gray-100 h-12 rounded-xl px-5 py-2 button-press-feedback">
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
                    checked={selectedPartners.length === partners.length && partners.length > 0}
                    onChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Name
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Email
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Partner Type
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Status
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Revenue
                </th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => (
                <tr
                  key={partner.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="py-3 px-4 w-12">
                    <Checkbox
                      checked={selectedPartners.includes(partner.id)}
                      onChange={(checked) => handleSelectPartner(partner.id, checked as boolean)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={partner.avatar}
                        alt={partner.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <a href="#" className="hover:text-primary font-semibold text-gray-900 dark:text-gray-100">
                        {partner.name}
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{partner.email}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{partner.partnerType}</td>
                  <td className="py-3 px-4">
                    <Tag className={`${getStatusColor(partner.status)} text-gray-900 dark:text-gray-900`}>
                      {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                    </Tag>
                  </td>
                  <td className="py-3 px-4 font-semibold">{partner.revenue}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <button className="text-xl cursor-pointer hover:text-primary" title="Edit">
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
                      <button className="text-xl cursor-pointer hover:text-primary" title="View">
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
                          <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                          <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"></path>
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
            Showing 1 to {filteredPartners.length} of {partners.length} results
          </div>
          <Pagination />
        </div>
      </div>
    </Card>
  )
}

export default Partnership
