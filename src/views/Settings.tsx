import { useState } from 'react'
import PageContainer from '@/components/template/PageContainer'

type SettingsTab = 'profile' | 'security' | 'notification' | 'billing' | 'integration'

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'notification', label: 'Notification', icon: 'bell' },
    { id: 'billing', label: 'Billing', icon: 'file' },
    { id: 'integration', label: 'Integration', icon: 'refresh' },
  ]

  return (
    <PageContainer>
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
                {activeTab === 'profile' && <ProfileSettings />}
                {activeTab === 'security' && <SecuritySettings />}
                {activeTab === 'notification' && <NotificationSettings />}
                {activeTab === 'billing' && <BillingSettings />}
                {activeTab === 'integration' && <IntegrationSettings />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

const ProfileSettings = () => (
  <div>
    <h4 className="mb-8">Personal information</h4>
    <form>
      <div className="form-container vertical">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <span
              className="avatar avatar-circle border-4 border-white bg-gray-100 text-gray-300 shadow-lg"
              style={{
                width: '90px',
                height: '90px',
                minWidth: '90px',
                lineHeight: '90px',
                fontSize: '45px',
              }}
            >
              <img
                className="avatar-img avatar-circle"
                loading="lazy"
                src="/img/avatars/thumb-1.jpg"
                alt="Avatar"
              />
            </span>
            <div className="flex items-center gap-2">
              <div className="upload">
                <input className="upload-input" type="file" />
                <button
                  className="button bg-primary hover:bg-primary-mild text-neutral h-10 rounded-xl px-3 py-2 text-sm button-press-feedback"
                  type="button"
                >
                  <span className="flex gap-1 items-center justify-center">
                    <span className="text-lg">+</span>
                    <span>Upload Image</span>
                  </span>
                </button>
              </div>
              <button
                className="button bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-700 text-gray-600 dark:text-gray-100 h-10 rounded-xl px-3 py-2 text-sm button-press-feedback"
                type="button"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-item vertical">
            <label className="form-label mb-2">First name</label>
            <input
              className="input input-md h-12"
              placeholder="First Name"
              type="text"
              defaultValue="Angelina"
              name="firstName"
            />
          </div>
          <div className="form-item vertical">
            <label className="form-label mb-2">User name</label>
            <input
              className="input input-md h-12"
              placeholder="Last Name"
              type="text"
              defaultValue="Gotelli"
              name="lastName"
            />
          </div>
        </div>

        <div className="form-item vertical">
          <label className="form-label mb-2">Email</label>
          <input
            className="input input-md h-12"
            placeholder="Email"
            type="email"
            defaultValue="carolyn_h@hotmail.com"
            name="email"
          />
        </div>

        <div className="flex items-end gap-4 w-full mb-6">
          <div className="form-item vertical">
            <label className="form-label mb-2">Phone number</label>
            <input
              className="input input-md h-12"
              placeholder="Phone Number"
              type="text"
              defaultValue="121231234"
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
            defaultValue="United States"
            name="country"
          />
        </div>

        <div className="form-item vertical">
          <label className="form-label mb-2">Address</label>
          <input
            className="input input-md h-12"
            placeholder="Address"
            type="text"
            defaultValue="123 Main St"
            name="address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-item vertical">
            <label className="form-label mb-2">City</label>
            <input
              className="input input-md h-12"
              placeholder="City"
              type="text"
              defaultValue="New York"
              name="city"
            />
          </div>
          <div className="form-item vertical">
            <label className="form-label mb-2">Postal Code</label>
            <input
              className="input input-md h-12"
              placeholder="Postal Code"
              type="text"
              defaultValue="10001"
              name="postcode"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="button bg-primary hover:bg-primary-mild text-neutral h-12 rounded-xl px-5 py-2 button-press-feedback"
            type="submit"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  </div>
)

const SecuritySettings = () => (
  <div>
    <h4 className="mb-8">Security Settings</h4>
    <p className="text-gray-600 dark:text-gray-400">Security settings coming soon...</p>
  </div>
)

const NotificationSettings = () => (
  <div>
    <h4 className="mb-8">Notification Settings</h4>
    <p className="text-gray-600 dark:text-gray-400">Notification settings coming soon...</p>
  </div>
)

const BillingSettings = () => (
  <div>
    <h4 className="mb-8">Billing Settings</h4>
    <p className="text-gray-600 dark:text-gray-400">Billing settings coming soon...</p>
  </div>
)

const IntegrationSettings = () => (
  <div>
    <h4 className="mb-8">Integration Settings</h4>
    <p className="text-gray-600 dark:text-gray-400">Integration settings coming soon...</p>
  </div>
)

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
    bell: (
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
        <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"></path>
        <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
      </svg>
    ),
    file: (
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
        <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
        <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
        <path d="M14 11h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5"></path>
        <path d="M12 17v1m0 -8v1"></path>
      </svg>
    ),
    refresh: (
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
        <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"></path>
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path>
        <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
      </svg>
    ),
  }
  return icons[icon] || null
}

export default Settings
