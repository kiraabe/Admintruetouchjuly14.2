import { useMemo, useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Segment from '@/components/ui/Segment'
import Avatar from '@/components/ui/Avatar'
import Chart from '@/components/shared/Chart'
import { useSessionUser } from '@/store/authStore'
import ApiService from '@/services/ApiService'

interface KPI {
  title: string
  value: string | number
  change: string
  icon: React.ReactNode
  bgColor: string
}

interface SpecialRequest {
  request_id: string
  request_type: string
  company_name: string
  position: string
  number_of_employees: number
  status: string
  start_date: string
  created_at: string
}

interface PartnershipMetric {
  label: string
  score: string
  status: 'success' | 'warning' | 'error'
}

const kpiIcons = [
  <svg key="1" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path>
    <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>
  </svg>,
  <svg key="2" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9"></path>
    <path d="M12 9v3l2 1"></path>
  </svg>,
  <svg key="3" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"></path>
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path>
  </svg>,
  <svg key="4" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 3h5a1.5 1.5 0 0 1 1.5 1.5a3.5 3.5 0 0 1 -3.5 3.5h-1a3.5 3.5 0 0 1 -3.5 -3.5a1.5 1.5 0 0 1 1.5 -1.5z"></path>
    <path d="M4 17v-1a8 8 0 0 1 16 0v1a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z"></path>
  </svg>,
]

const PartnershipDashboard = () => {
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [requests, setRequests] = useState<SpecialRequest[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useSessionUser()

  useEffect(() => {
    const calculateKPIs = (requestsData: SpecialRequest[]) => {
      const totalRequests = requestsData.length
      const approvedRequests = requestsData.filter((r) => r.status === 'Approved').length
      const pendingRequests = requestsData.filter((r) => r.status === 'Pending').length
      const totalPositions = requestsData.reduce((sum, r) => sum + r.number_of_employees, 0)
      const fulfillmentRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0

      const calculatedKpis: KPI[] = [
        {
          title: 'Total Requests',
          value: totalRequests,
          change: '+8.3%',
          icon: kpiIcons[0],
          bgColor: 'bg-rose-200',
        },
        {
          title: 'Pending Requests',
          value: pendingRequests,
          change: '+2.1%',
          icon: kpiIcons[1],
          bgColor: 'bg-yellow-200',
        },
        {
          title: 'Fulfillment Rate',
          value: `${fulfillmentRate}%`,
          change: '+5.4%',
          icon: kpiIcons[2],
          bgColor: 'bg-emerald-200',
        },
        {
          title: 'Total Positions',
          value: totalPositions,
          change: '+11.2%',
          icon: kpiIcons[3],
          bgColor: 'bg-purple-200',
        },
      ]

      setKpis(calculatedKpis)
    }

    const fetchData = async () => {
      try {
        const [specialRes, standardRes] = await Promise.all([
          ApiService.fetchDataWithAxios<any>({
            method: 'GET',
            url: '/special-requests?page=1&limit=1000',
          }),
          ApiService.fetchDataWithAxios<any>({
            method: 'GET',
            url: '/standard-requests?page=1&limit=1000',
          }),
        ])

        const specialRequestsData = specialRes.data || []
        const standardRequestsData = standardRes.data || []
        const allRequests = [...specialRequestsData, ...standardRequestsData]

        setRequests(allRequests)
        calculateKPIs(allRequests)
      } catch (error: any) {
        console.error('Error fetching requests:', error)
        if (error.response?.status === 401) {
          console.error('Authentication failed. Token issue or user not authorized.')
        } else if (error.response?.status === 403) {
          console.error('Permission denied. User does not have partnership access.')
        }
        if (error.response?.data) {
          console.error('API Response:', error.response.data)
        }
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])


  // Filter to show only active requests (exclude Rejected status)
  const activeRequests = requests.filter((request) => request.status !== 'Rejected')

  const campaigns: SpecialRequest[] = activeRequests.map((request) => ({
    ...request,
  }))

  // Generate chart data based on selected segment and actual requests only
  const getFilteredRequests = () => {
    if (selectedSegment === 'standard') {
      return activeRequests.filter((r) => r.request_type === 'Standard')
    } else if (selectedSegment === 'special') {
      return activeRequests.filter((r) => r.request_type === 'Special')
    }
    return activeRequests
  }

  // Generate last 12 days and calculate daily metrics
  const getLast12DaysData = () => {
    const today = new Date()
    const days = []
    const receivedData = []
    const fulfilledData = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const filteredRequests = getFilteredRequests()
      const dayRequests = filteredRequests.filter((r) => {
        const requestDate = new Date(r.created_at)
        requestDate.setHours(0, 0, 0, 0)
        return requestDate >= date && requestDate < nextDate
      })

      const dayApproved = dayRequests.filter((r) => r.status === 'Approved').length

      days.push(date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }))
      receivedData.push(dayRequests.length)
      fulfilledData.push(dayApproved)
    }

    return { days, receivedData, fulfilledData }
  }

  const { days: chartXAxis, receivedData, fulfilledData } = getLast12DaysData()
  const totalFiltered = getFilteredRequests().length
  const approvedFiltered = getFilteredRequests().filter((r) => r.status === 'Approved').length
  const fulfillmentRate = totalFiltered > 0 ? Math.round((approvedFiltered / totalFiltered) * 100) : 0

  const chartSeries = [
    {
      name: 'Requests Received',
      data: receivedData,
    },
    {
      name: 'Requests Fulfilled',
      data: fulfilledData,
    },
  ]

  // Calculate performance scores based on actual data only
  const performanceScores: PartnershipMetric[] = [
    { label: 'Fulfillment Rate', score: `${fulfillmentRate}%`, status: fulfillmentRate >= 75 ? 'success' : fulfillmentRate >= 50 ? 'warning' : 'error' },
  ]

  const overallScore = fulfillmentRate

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-200'
      case 'In Progress':
        return 'bg-sky-200'
      case 'Pending':
        return 'bg-yellow-200'
      case 'Rejected':
        return 'bg-red-200'
      default:
        return 'bg-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="py-8 text-center text-gray-500">Loading partnership data...</div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">Partnership KPIs</h4>
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
        {/* Performance Chart */}
        <div className="col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold">Request Performance</h4>
              <Segment>
                <button className={`px-3 py-2 text-sm rounded ${selectedSegment === 'all' ? 'bg-gray-200' : ''}`} onClick={() => setSelectedSegment('all')}>
                  All
                </button>
                <button className={`px-3 py-2 text-sm rounded ${selectedSegment === 'standard' ? 'bg-gray-200' : ''}`} onClick={() => setSelectedSegment('standard')}>
                  Standard
                </button>
                <button className={`px-3 py-2 text-sm rounded ${selectedSegment === 'special' ? 'bg-gray-200' : ''}`} onClick={() => setSelectedSegment('special')}>
                  Special
                </button>
              </Segment>
            </div>
            <div style={{ minHeight: '465px' }}>
              <Chart type="line" height={450} series={chartSeries} xAxis={chartXAxis} />
            </div>
          </Card>
        </div>

        {/* Performance Score */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold">Partnership Performance</h4>
          </div>
          <div style={{ minHeight: '265px' }} className="flex items-center justify-center mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{overallScore}%</div>
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

      {/* Active Requests Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">Active Special Requests</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4">
                  <input type="checkbox" />
                </th>
                <th className="text-left py-3 px-4">Company</th>
                <th className="text-left py-3 px-4">Position</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Positions</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Start</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No active requests
                  </td>
                </tr>
              ) : (
                campaigns.slice(0, 10).map((campaign) => (
                  <tr key={campaign.request_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <input type="checkbox" />
                    </td>
                    <td className="py-3 px-4 font-semibold">{campaign.company_name}</td>
                    <td className="py-3 px-4">{campaign.position}</td>
                    <td className="py-3 px-4">
                      <Tag className={getStatusColor(campaign.status)}>{campaign.status}</Tag>
                    </td>
                    <td className="py-3 px-4">{campaign.number_of_employees}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{campaign.request_type}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(campaign.start_date || campaign.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default PartnershipDashboard
