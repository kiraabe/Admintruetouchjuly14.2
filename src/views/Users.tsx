import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import Pagination from '@/components/ui/Pagination'
import Checkbox from '@/components/ui/Checkbox'

interface User {
  id: number
  name: string
  email: string
  location: string
  status: 'active' | 'blocked'
  spent: string
  avatar: string
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])

  const users: User[] = [
    {
      id: 1,
      name: 'Angelina Gotelli',
      email: 'carolyn_h@hotmail.com',
      location: 'New York, US',
      status: 'active',
      spent: '$4367.15',
      avatar: '/img/avatars/thumb-1.jpg',
    },
    {
      id: 2,
      name: 'Jeremiah Minsk',
      email: 'terrance_moreno@infotech.io',
      location: 'Tokyo, JP',
      status: 'active',
      spent: '$7823.42',
      avatar: '/img/avatars/thumb-2.jpg',
    },
    {
      id: 3,
      name: 'Max Alexander',
      email: 'ronnie_vergas@infotech.io',
      location: 'Mumbai, IN',
      status: 'blocked',
      spent: '$2478.33',
      avatar: '/img/avatars/thumb-3.jpg',
    },
    {
      id: 4,
      name: 'Shannon Baker',
      email: 'cookie_lukie@hotmail.com',
      location: 'New York, US',
      status: 'active',
      spent: '$234.56',
      avatar: '/img/avatars/thumb-4.jpg',
    },
    {
      id: 5,
      name: 'Eugene Stewart',
      email: 'joyce991@infotech.io',
      location: 'Ottawa, CA',
      status: 'active',
      spent: '$1201.45',
      avatar: '/img/avatars/thumb-5.jpg',
    },
    {
      id: 6,
      name: 'Arlene Pierce',
      email: 'samanthaphil@infotech.io',
      location: 'London, UK',
      status: 'active',
      spent: '$8923.11',
      avatar: '/img/avatars/thumb-6.jpg',
    },
    {
      id: 7,
      name: 'Roberta Horton',
      email: 'taratarara@imaze.edu.du',
      location: 'Brasília, BR',
      status: 'active',
      spent: '$465.78',
      avatar: '/img/avatars/thumb-7.jpg',
    },
    {
      id: 8,
      name: 'Jessica Wells',
      email: 'iamfred@imaze.infotech.io',
      location: 'London, UK',
      status: 'blocked',
      spent: '$890.43',
      avatar: '/img/avatars/thumb-8.jpg',
    },
    {
      id: 9,
      name: 'Camila Simmmons',
      email: 'carolyn_h@gmail.com',
      location: 'Ankara, TR',
      status: 'blocked',
      spent: '$3456.22',
      avatar: '/img/avatars/thumb-9.jpg',
    },
    {
      id: 10,
      name: 'Earl Miles',
      email: 'brittany1134@gmail.com',
      location: 'Texas, US',
      status: 'active',
      spent: '$7890.12',
      avatar: '/img/avatars/thumb-10.jpg',
    },
  ]

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((u) => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, id])
    } else {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id))
    }
  }

  const handleDownload = () => {
    const csv = [
      ['Name', 'Email', 'Location', 'Status', 'Spent'],
      ...users.map((u) => [u.name, u.email, u.location, u.status, u.spent]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'userList.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-emerald-200' : 'bg-red-200'
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h3 className="text-xl font-bold">Users</h3>
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
                    checked={selectedUsers.length === users.length && users.length > 0}
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
                  Location
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Status
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Spent
                </th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="py-3 px-4 w-12">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <a href="#" className="hover:text-primary font-semibold text-gray-900 dark:text-gray-100">
                        {user.name}
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.location}</td>
                  <td className="py-3 px-4">
                    <Tag className={`${getStatusColor(user.status)} text-gray-900 dark:text-gray-900`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Tag>
                  </td>
                  <td className="py-3 px-4 font-semibold">{user.spent}</td>
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
            Showing 1 to {filteredUsers.length} of {users.length} results
          </div>
          <Pagination />
        </div>
      </div>
    </Card>
  )
}

export default Users
