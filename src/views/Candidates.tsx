import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import Pagination from '@/components/ui/Pagination'
import Checkbox from '@/components/ui/Checkbox'

interface Candidate {
  id: number
  name: string
  email: string
  position: string
  status: 'applied' | 'interviewing' | 'rejected' | 'offered'
  appliedDate: string
  avatar: string
}

const Candidates = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([])

  const candidates: Candidate[] = [
    {
      id: 1,
      name: 'Angelina Gotelli',
      email: 'angelina_g@hotmail.com',
      position: 'Senior Developer',
      status: 'interviewing',
      appliedDate: '2024-05-01',
      avatar: '/img/avatars/thumb-1.jpg',
    },
    {
      id: 2,
      name: 'Jeremiah Minsk',
      email: 'jeremiah_m@infotech.io',
      position: 'Product Manager',
      status: 'offered',
      appliedDate: '2024-04-28',
      avatar: '/img/avatars/thumb-2.jpg',
    },
    {
      id: 3,
      name: 'Max Alexander',
      email: 'max_a@infotech.io',
      position: 'UX Designer',
      status: 'rejected',
      appliedDate: '2024-04-25',
      avatar: '/img/avatars/thumb-3.jpg',
    },
    {
      id: 4,
      name: 'Shannon Baker',
      email: 'shannon_b@hotmail.com',
      position: 'Marketing Lead',
      status: 'applied',
      appliedDate: '2024-05-03',
      avatar: '/img/avatars/thumb-4.jpg',
    },
    {
      id: 5,
      name: 'Eugene Stewart',
      email: 'eugene_s@infotech.io',
      position: 'DevOps Engineer',
      status: 'interviewing',
      appliedDate: '2024-04-30',
      avatar: '/img/avatars/thumb-5.jpg',
    },
    {
      id: 6,
      name: 'Arlene Pierce',
      email: 'arlene_p@infotech.io',
      position: 'Data Analyst',
      status: 'applied',
      appliedDate: '2024-05-02',
      avatar: '/img/avatars/thumb-6.jpg',
    },
    {
      id: 7,
      name: 'Roberta Horton',
      email: 'roberta_h@imaze.edu.du',
      position: 'Business Analyst',
      status: 'interviewing',
      appliedDate: '2024-04-29',
      avatar: '/img/avatars/thumb-7.jpg',
    },
    {
      id: 8,
      name: 'Jessica Wells',
      email: 'jessica_w@imaze.infotech.io',
      position: 'QA Engineer',
      status: 'rejected',
      appliedDate: '2024-04-26',
      avatar: '/img/avatars/thumb-8.jpg',
    },
    {
      id: 9,
      name: 'Camila Simmmons',
      email: 'camila_s@gmail.com',
      position: 'Frontend Developer',
      status: 'offered',
      appliedDate: '2024-04-27',
      avatar: '/img/avatars/thumb-9.jpg',
    },
    {
      id: 10,
      name: 'Earl Miles',
      email: 'earl_m@gmail.com',
      position: 'Backend Developer',
      status: 'applied',
      appliedDate: '2024-05-04',
      avatar: '/img/avatars/thumb-10.jpg',
    },
  ]

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(candidates.map((c) => c.id))
    } else {
      setSelectedCandidates([])
    }
  }

  const handleSelectCandidate = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedCandidates([...selectedCandidates, id])
    } else {
      setSelectedCandidates(selectedCandidates.filter((cid) => cid !== id))
    }
  }

  const handleDownload = () => {
    const csv = [
      ['Name', 'Email', 'Position', 'Status', 'Applied Date'],
      ...candidates.map((c) => [c.name, c.email, c.position, c.status, c.appliedDate]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'candidateList.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'offered':
        return 'bg-emerald-200'
      case 'interviewing':
        return 'bg-sky-200'
      case 'rejected':
        return 'bg-red-200'
      default:
        return 'bg-gray-200'
    }
  }

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h3 className="text-xl font-bold">Candidates</h3>
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
                    checked={selectedCandidates.length === candidates.length && candidates.length > 0}
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
                  Position
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Status
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Applied Date
                </th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="py-3 px-4 w-12">
                    <Checkbox
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={(checked) => handleSelectCandidate(candidate.id, checked as boolean)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={candidate.avatar}
                        alt={candidate.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <a href="#" className="hover:text-primary font-semibold text-gray-900 dark:text-gray-100">
                        {candidate.name}
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{candidate.email}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{candidate.position}</td>
                  <td className="py-3 px-4">
                    <Tag className={`${getStatusColor(candidate.status)} text-gray-900 dark:text-gray-900`}>
                      {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                    </Tag>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{candidate.appliedDate}</td>
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
            Showing 1 to {filteredCandidates.length} of {candidates.length} results
          </div>
          <Pagination />
        </div>
      </div>
    </Card>
  )
}

export default Candidates
