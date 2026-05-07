import { useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Segment from '@/components/ui/Segment'
import Avatar from '@/components/ui/Avatar'
import Chart from '@/components/shared/Chart'

interface KPI {
  title: string
  value: string | number
  change: string
  icon: React.ReactNode
  bgColor: string
}

interface Campaign {
  id: string
  name: string
  type: string
  status: 'Active' | 'Completed' | 'Scheduled'
  budget: string
  conversions: string
  startDate: string
  endDate: string
  icon: React.ReactNode
}

const Dashboard = () => {
  const [selectedSegment, setSelectedSegment] = useState('all')

  const kpis: KPI[] = [
    {
      title: 'Total marketing spend',
      value: '$192,817',
      change: '+5.3%',
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.5 3h5a1.5 1.5 0 0 1 1.5 1.5a3.5 3.5 0 0 1 -3.5 3.5h-1a3.5 3.5 0 0 1 -3.5 -3.5a1.5 1.5 0 0 1 1.5 -1.5z"></path>
          <path d="M4 17v-1a8 8 0 1 1 16 0v1a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z"></path>
        </svg>
      ),
      bgColor: 'bg-rose-200',
    },
    {
      title: 'ROI',
      value: '270%',
      change: '+8.1%',
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path>
          <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>
          <path d="M14 11h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5"></path>
          <path d="M12 17v1m0 -8v1"></path>
        </svg>
      ),
      bgColor: 'bg-sky-200',
    },
    {
      title: 'Conversion rates',
      value: '4.5%',
      change: '+0.9%',
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"></path>
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path>
          <path d="M12 9l0 3"></path>
          <path d="M12 15l.01 0"></path>
        </svg>
      ),
      bgColor: 'bg-emerald-200',
    },
    {
      title: 'Total leads',
      value: '1,289',
      change: '+16.2%',
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 13v-8a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v8a2 2 0 0 0 6 0v-8a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v8a8 8 0 0 1 -16 0"></path>
          <path d="M4 8l5 0"></path>
          <path d="M15 8l4 0"></path>
        </svg>
      ),
      bgColor: 'bg-purple-200',
    },
  ]

  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Summer Sale',
      type: 'Promotional',
      status: 'Completed',
      budget: '$20,000',
      conversions: '50%',
      startDate: '27 Apr 2026',
      endDate: '10 May 2026',
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.5 3h5a1.5 1.5 0 0 1 1.5 1.5a3.5 3.5 0 0 1 -3.5 3.5h-1a3.5 3.5 0 0 1 -3.5 -3.5a1.5 1.5 0 0 1 1.5 -1.5z"></path>
        </svg>
      ),
    },
    {
      id: '2',
      name: 'Back-to-School Promo',
      type: 'Seasonal',
      status: 'Active',
      budget: '$15,000',
      conversions: '35%',
      startDate: '02 May 2026',
      endDate: '11 May 2026',
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 21c.5 -4.5 2.5 -8 7 -10"></path>
        </svg>
      ),
    },
    {
      id: '3',
      name: 'New Product Launch',
      type: 'Seasonal',
      status: 'Active',
      budget: '$30,000',
      conversions: '60%',
      startDate: '05 May 2026',
      endDate: '13 May 2026',
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 21c.5 -4.5 2.5 -8 7 -10"></path>
        </svg>
      ),
    },
    {
      id: '4',
      name: 'Holiday Gift Guide',
      type: 'Launch',
      status: 'Scheduled',
      budget: '$50,000',
      conversions: '0%',
      startDate: '02 May 2026',
      endDate: '11 May 2026',
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3"></path>
        </svg>
      ),
    },
    {
      id: '5',
      name: 'Clearance Sale',
      type: 'Promotional',
      status: 'Active',
      budget: '$10,000',
      conversions: '20%',
      startDate: '02 May 2026',
      endDate: '11 May 2026',
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.5 3h5a1.5 1.5 0 0 1 1.5 1.5a3.5 3.5 0 0 1 -3.5 3.5h-1a3.5 3.5 0 0 1 -3.5 -3.5a1.5 1.5 0 0 1 1.5 -1.5z"></path>
        </svg>
      ),
    },
  ]

  const chartSeries = [
    {
      name: 'Campaign ROI',
      data: [440, 505, 414, 671, 227, 413, 201, 352, 752, 320, 257, 160],
    },
    {
      name: 'Email ROI',
      data: [230, 100, 170, 190, 120, 170, 180, 270, 200, 300, 310, 280],
    },
  ]

  const chartXAxis = ['01 Jan', '02 Jan', '03 Jan', '04 Jan', '05 Jan', '06 Jan', '07 Jan', '08 Jan', '09 Jan', '10 Jan', '11 Jan', '12 Jan']

  const performanceScores = [
    { label: 'Lead Volume', score: '78%', status: 'success' },
    { label: 'Conversion Rate', score: '57%', status: 'warning' },
    { label: 'Lead Quality', score: '26%', status: 'error' },
    { label: 'Response Time', score: '76%', status: 'success' },
    { label: 'Cost per Lead', score: '42%', status: 'warning' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-sky-200'
      case 'Completed':
        return 'bg-emerald-200'
      case 'Scheduled':
        return 'bg-orange-200'
      default:
        return 'bg-gray-200'
    }
  }

  const columns = useMemo(
    () => [
      {
        Header: '',
        id: 'checkbox',
        Cell: () => <input type="checkbox" />,
      },
      {
        Header: 'Campaign',
        accessor: 'name',
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Budget',
        accessor: 'budget',
      },
      {
        Header: 'Conversions',
        accessor: 'conversions',
      },
      {
        Header: 'Start',
        accessor: 'startDate',
      },
      {
        Header: 'End',
        accessor: 'endDate',
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">Kpi summary</h4>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.title} className="flex flex-col gap-2 py-4 px-6 border-b md:border-b-0 md:ltr:border-r border-gray-200 dark:border-gray-700">
              <div className={`flex items-center justify-center min-h-12 min-w-12 max-h-12 max-w-12 text-gray-900 rounded-full text-2xl ${kpi.bgColor}`}>
                {kpi.icon}
              </div>
              <div className="mt-4">
                <div className="mb-1 text-sm">{kpi.title}</div>
                <h3 className="mb-1 text-xl font-bold">{kpi.value}</h3>
                <div className="inline-flex items-center flex-wrap gap-1">
                  <span className="flex items-center text-success font-bold">
                    <span>+</span>
                    <span>{kpi.change}</span>
                  </span>
                  <span className="text-sm">vs last month</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-y-4 xl:gap-x-4">
        {/* Ads Performance Chart */}
        <div className="col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold">Ads performance</h4>
              <Segment>
                <button className={`px-3 py-2 text-sm rounded ${selectedSegment === 'all' ? 'bg-gray-200' : ''}`} onClick={() => setSelectedSegment('all')}>
                  All
                </button>
                <button className={`px-3 py-2 text-sm rounded ${selectedSegment === 'campaign' ? 'bg-gray-200' : ''}`} onClick={() => setSelectedSegment('campaign')}>
                  Campaign
                </button>
                <button className={`px-3 py-2 text-sm rounded ${selectedSegment === 'email' ? 'bg-gray-200' : ''}`} onClick={() => setSelectedSegment('email')}>
                  Email
                </button>
              </Segment>
            </div>
            <div style={{ minHeight: '465px' }}>
              <Chart type="line" height={450} series={chartSeries} xAxis={chartXAxis} />
            </div>
          </Card>
        </div>

        {/* Lead Performance Score */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold">Lead performance score</h4>
          </div>
          <div style={{ minHeight: '265px' }} className="flex items-center justify-center mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">78%</div>
              <p className="text-gray-600 mt-2">Overall Score</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {performanceScores.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="heading-text font-bold">{item.label}</div>
                </div>
                <div className="border-dashed border-b border-gray-300 dark:border-gray-500 flex-1"></div>
                <div>
                  <span className={`rounded-full px-2 py-1 text-white text-sm ${item.status === 'success' ? 'bg-success' : item.status === 'warning' ? 'bg-warning' : 'bg-error'}`}>{item.score}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">Campaigns</h4>
          <Button variant="default">Create campaign</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4">
                  <input type="checkbox" />
                </th>
                <th className="text-left py-3 px-4">Campaign</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Budget</th>
                <th className="text-left py-3 px-4">Conversions</th>
                <th className="text-left py-3 px-4">Start</th>
                <th className="text-left py-3 px-4">End</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4">
                    <input type="checkbox" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar size={50} className="text-2xl">{campaign.icon}</Avatar>
                      <div>
                        <div className="font-bold">{campaign.name}</div>
                        <div className="text-xs text-gray-500">{campaign.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Tag className={getStatusColor(campaign.status)}>{campaign.status}</Tag>
                  </td>
                  <td className="py-3 px-4">{campaign.budget}</td>
                  <td className="py-3 px-4">{campaign.conversions}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{campaign.startDate}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{campaign.endDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
