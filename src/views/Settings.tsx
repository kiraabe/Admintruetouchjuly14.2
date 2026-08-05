import { useState, useEffect } from 'react'
import PageContainer from '@/components/template/PageContainer'
import useAuth from '@/auth/useAuth'
import ApiService from '@/services/ApiService'

type SettingsTab = 'profile' | 'security'

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const { user } = useAuth()

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'security', label: 'Security', icon: 'lock' },
  ]

  return (
    <PageContainer footer={false}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold">Settings</h3>
        </div>
      </div>

      <div className="container mx-auto h-full">
        <div className="card h-full card-border" role="presentation">
          <div className="card-body">
            <div className="flex flex-auto h-full">
              {/* Sidebar Menu */}
              <div className="w-[200px] xl:w-[280px]">
                <div className="flex flex-col justify-between h-full">
                  <div className="h-full overflow-y-auto">
                    <nav className="menu mx-2 mb-10">
                      {menuItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setActiveTab(item.id as SettingsTab)}
                          className={`menu-item menu-item-hoverable mb-2 cursor-pointer ${
                            activeTab === item.id
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : ''
                          }`}
                          style={{ height: '48px' }}
                        >
                          <span className="text-2xl ltr:mr-2 rtl:ml-2">
                            {getIconSVG(item.icon)}
                          </span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="xl:ltr:pl-6 xl:rtl:pr-6 flex-1 py-2">
                {activeTab === 'profile' && <ProfileSettings user={user} />}
                {activeTab === 'security' && <SecuritySettings userId={user?.userId} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

interface UserData {
  userId?: string | null
  avatar?: string | null
  userName?: string | null
  email?: string | null
  authority?: string[]
}

const ProfileSettings = ({ user }: { user?: UserData }) => {
  const [formData, setFormData] = useState({
    firstName: user?.userName?.split(' ')[0] || '',
    lastName: user?.userName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    country: 'United States',
    address: '123 Main St',
    city: 'New York',
    postcode: '10001',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      const response = await ApiService.fetchDataWithAxios({
        url: `/users/${user?.userId}`,
        method: 'PUT',
        data: {
          user_name: fullName,
          email: formData.email,
        },
      })

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h4 className="mb-8">Personal information</h4>
      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-container vertical">

          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-item vertical">
              <label className="form-label mb-2">First name</label>
              <input
                className="input input-md h-12"
                placeholder="First Name"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="form-item vertical">
              <label className="form-label mb-2">Last name</label>
              <input
                className="input input-md h-12"
                placeholder="Last Name"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-item vertical">
            <label className="form-label mb-2">Email</label>
            <input
              className="input input-md h-12"
              placeholder="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-end gap-4 w-full mb-6">
            <div className="form-item vertical">
              <label className="form-label mb-2">Phone number</label>
              <input
                className="input input-md h-12"
                placeholder="Phone Number"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                inputMode="numeric"
              />
            </div>
          </div>

          <h4 className="mb-6">Address information</h4>

          <div className="form-item vertical">
            <label className="form-label mb-2">Country</label>
            <input
              className="input input-md h-12"
              placeholder="Country"
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>

          <div className="form-item vertical">
            <label className="form-label mb-2">Address</label>
            <input
              className="input input-md h-12"
              placeholder="Address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-item vertical">
              <label className="form-label mb-2">City</label>
              <input
                className="input input-md h-12"
                placeholder="City"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="form-item vertical">
              <label className="form-label mb-2">Postal Code</label>
              <input
                className="input input-md h-12"
                placeholder="Postal Code"
                type="text"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="button bg-primary hover:bg-primary-mild text-neutral h-12 rounded-xl px-5 py-2 button-press-feedback disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

const SecuritySettings = ({ userId }: { userId?: string | null }) => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswords(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)

    try {
      await ApiService.fetchDataWithAxios({
        url: `/users/change-password`,
        method: 'POST',
        data: {
          userId: userId,
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
      })

      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h4 className="mb-8">Security Settings</h4>
      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="form-container vertical">
          <div className="mb-6">
            <h5 className="font-semibold mb-4">Change Password</h5>

            <div className="form-item vertical mb-4">
              <label className="form-label mb-2">Current Password</label>
              <input
                className="input input-md h-12"
                placeholder="Enter current password"
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-item vertical mb-4">
              <label className="form-label mb-2">New Password</label>
              <input
                className="input input-md h-12"
                placeholder="Enter new password"
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handleChange}
                required
              />
              <small className="text-gray-500 mt-1">Must be at least 6 characters</small>
            </div>

            <div className="form-item vertical mb-4">
              <label className="form-label mb-2">Confirm Password</label>
              <input
                className="input input-md h-12"
                placeholder="Confirm new password"
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                className="button bg-primary hover:bg-primary-mild text-neutral h-12 rounded-xl px-5 py-2 button-press-feedback disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

function getIconSVG(icon: string) {
  const icons: Record<string, JSX.Element> = {
    user: (
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
        <path d="M9 10a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path>
        <path d="M6 21v-1a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v1"></path>
        <path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z"></path>
      </svg>
    ),
    lock: (
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
        <path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z"></path>
        <path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"></path>
        <path d="M8 11v-4a4 4 0 1 1 8 0v4"></path>
      </svg>
    ),
  }
  return icons[icon] || null
}

export default Settings
