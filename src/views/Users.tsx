import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import Pagination from '@/components/ui/Pagination'
import Checkbox from '@/components/ui/Checkbox'
import { notify } from '@/utils/notification'

interface User {
  id: number
  user_id: string
  email: string
  user_name: string
  authority: string
  is_active: boolean
  avatar: string
  created_at: string
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.data || [])
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch users'
      console.error('Error fetching users:', error)
      notify.error('Error', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return
    try {
      const response = await fetch(`/api/users/${editingUser.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingUser.email,
          user_name: editingUser.user_name,
          authority: editingUser.authority,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      notify.success('Success', 'User updated successfully')
      setShowEditModal(false)
      fetchUsers()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update user'
      console.error('Error updating user:', error)
      notify.error('Error', errorMsg)
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) {
      notify.error('Error', 'Password is required')
      return
    }

    try {
      const response = await fetch(`/api/users/${resetPasswordUser.user_id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) {
        throw new Error('Failed to reset password')
      }

      notify.success('Success', 'Password reset successfully')
      setShowResetPasswordModal(false)
      setNewPassword('')
      fetchUsers()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reset password'
      console.error('Error resetting password:', error)
      notify.error('Error', errorMsg)
    }
  }

  const handleDeactivateUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.user_name}?`)) return

    try {
      const response = await fetch(`/api/users/${user.user_id}/deactivate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate user')
      }

      notify.success('Success', 'User deactivated successfully')
      fetchUsers()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to deactivate user'
      console.error('Error deactivating user:', error)
      notify.error('Error', errorMsg)
    }
  }

  const handleActivateUser = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.user_id}/activate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to activate user')
      }

      notify.success('Success', 'User activated successfully')
      fetchUsers()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to activate user'
      console.error('Error activating user:', error)
      notify.error('Error', errorMsg)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((u) => u.user_id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (id: string, checked: boolean) => {
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

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-emerald-200' : 'bg-red-200'
  }

  const filteredUsers = users.filter(
    (user) =>
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </Card>
    )
  }

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
                  Role
                </th>
                <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  Status
                </th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.user_id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="py-3 px-4 w-12">
                    <Checkbox
                      checked={selectedUsers.includes(user.user_id)}
                      onChange={(checked) => handleSelectUser(user.user_id, checked as boolean)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user.user_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{user.user_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 capitalize">{user.authority}</td>
                  <td className="py-3 px-4">
                    <Tag className={`${getStatusColor(user.is_active)} text-gray-900 dark:text-gray-900`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Tag>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user)
                          setShowEditModal(true)
                        }}
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
                        onClick={() => {
                          setResetPasswordUser(user)
                          setShowResetPasswordModal(true)
                        }}
                        className="text-xl cursor-pointer hover:text-primary"
                        title="Reset Password"
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
                          <path d="M5 13a3 3 0 0 0 3 3h7a3 3 0 0 0 3 -3M9 18v3h6v-3M7 10l.75 -1.5M17 10l-.75 -1.5M12 7v1m0 -8a2 2 0 0 1 2 2v2a2 2 0 1 1 -4 0v-2a2 2 0 0 1 2 -2Z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (user.is_active) {
                            handleDeactivateUser(user)
                          } else {
                            handleActivateUser(user)
                          }
                        }}
                        className="text-xl cursor-pointer hover:text-primary"
                        title={user.is_active ? 'Deactivate' : 'Activate'}
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Edit User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={editingUser.user_name}
                    onChange={(e) => setEditingUser({ ...editingUser, user_name: e.target.value })}
                    placeholder="User name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="Email"
                    type="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={editingUser.authority}
                    onChange={(e) => setEditingUser({ ...editingUser, authority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-10"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowEditModal(false)}
                  variant="default"
                >
                  Cancel
                </Button>
                <Button onClick={handleEditUser}>Save Changes</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && resetPasswordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Reset Password</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Set a new password for {resetPasswordUser.user_name}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowResetPasswordModal(false)
                    setNewPassword('')
                  }}
                  variant="default"
                >
                  Cancel
                </Button>
                <Button onClick={handleResetPassword}>Reset Password</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}

export default Users
