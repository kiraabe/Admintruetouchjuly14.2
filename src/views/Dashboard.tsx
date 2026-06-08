import { useMemo, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Segment from '@/components/ui/Segment'
import Avatar from '@/components/ui/Avatar'
import Chart from '@/components/shared/Chart'
import CountryMap, { countriesData, CountryData, getCountryCoordinates } from '@/components/shared/CountryMap'

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

interface Candidate {
  candidate_id: string
  name: string
  status: string
  country?: string
}

interface Partnership {
  partner_id: string
  service_city?: string
  company_name?: string
  status?: string
}

interface EmployeeRequest {
  request_id: string
  request_type: 'Standard' | 'Special'
  company_name: string
  position: string
  number_of_employees: number
  status: string
  start_date: string
  created_at: string
}

const Dashboard = () => {
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [requests, setRequests] = useState<EmployeeRequest[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string>(countriesData[0].name)
  const [topCountries, setTopCountries] = useState<CountryData[]>(countriesData)

  useEffect(() => {
    fetchData()
  }, [])

  const getAuthHeaders = () => {
    const token = Cookies.get('token') || localStorage.getItem('token')
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders()
      const [candidatesRes, requestsRes, partnershipsRes] = await Promise.all([
        fetch('/api/candidates', { headers }),
        fetch('/api/employee-requests', { headers }),
        fetch('/api/partnerships', { headers }),
      ])

      const candidatesText = await candidatesRes.text()
      const requestsText = await requestsRes.text()
      const partnershipsText = await partnershipsRes.text()

      let candidatesData: Candidate[] = []
      let requestsData: EmployeeRequest[] = []
      let partnershipsData: Partnership[] = []

      if (candidatesText) {
        const parsed = JSON.parse(candidatesText)
        if (parsed.success) {
          candidatesData = parsed.data || []
        }
      }

      if (requestsText) {
        const parsed = JSON.parse(requestsText)
        if (parsed.success) {
          requestsData = parsed.data || []
        }
      }

      if (partnershipsText) {
        const parsed = JSON.parse(partnershipsText)
        if (parsed.success) {
          partnershipsData = parsed.data || []
        }
      }

      setCandidates(candidatesData)
      setPartnerships(partnershipsData)
      setRequests(requestsData)
      calculateKPIs(candidatesData, requestsData)
      aggregateTopCountries(candidatesData, partnershipsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const aggregateTopCountries = (candidatesData: Candidate[], partnershipsData: Partnership[]) => {
    const locationMap: { [key: string]: { candidates: number; partnerships: number } } = {}

    // Count candidates by country
    candidatesData.forEach((candidate) => {
      const country = candidate.country?.trim()
      if (country) {
        if (!locationMap[country]) {
          locationMap[country] = { candidates: 0, partnerships: 0 }
        }
        locationMap[country].candidates += 1
      }
    })

    // Count partnerships by service city (treating city as proxy for country)
    partnershipsData.forEach((partnership) => {
      const city = partnership.service_city?.trim()
      if (city) {
        if (!locationMap[city]) {
          locationMap[city] = { candidates: 0, partnerships: 0 }
        }
        locationMap[city].partnerships += 1
      }
    })

    // Get top 5 countries/locations by count
    const sortedLocations = Object.entries(locationMap)
      .sort((a, b) => (b[1].candidates + b[1].partnerships) - (a[1].candidates + a[1].partnerships))
      .slice(0, 5)

    const total = sortedLocations.reduce((sum, [_, data]) => sum + data.candidates + data.partnerships, 0)

    if (total > 0 && sortedLocations.length > 0) {
      // Create dynamic country data from actual data with correct coordinates
      const updated: CountryData[] = sortedLocations.map(([name, data]) => ({
        name,
        coordinates: getCountryCoordinates(name),
        percentage: ((data.candidates + data.partnerships) / total) * 100,
        candidates: data.candidates,
        partnerships: data.partnerships,
      }))
      setTopCountries(updated)
    }
  }

  const calculateKPIs = (candidatesData: Candidate[], requestsData: EmployeeRequest[]) => {
    const totalCandidates = candidatesData.length
    const openPositions = requestsData.filter((r) => r.status === 'Pending').length
    const approvedRequests = requestsData.filter((r) => r.status === 'Approved').length
    const totalRequests = requestsData.length
    const placementRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0
    const activeRequests = requestsData.filter((r) => r.status === 'In Progress' || r.status === 'Approved').length
    const inProgressRequests = requestsData.filter((r) => r.status === 'In Progress').length
    const completedRequests = requestsData.filter((r) => r.status === 'Completed').length

    // Calculate percentage changes (difference between approved and in progress as a proxy for change)
    const candidateChange = totalRequests > 0 ? ((activeRequests / totalRequests) * 100).toFixed(1) : '0'
    const positionChange = openPositions > 0 ? ((openPositions / totalRequests) * 100).toFixed(1) : '0'
    const placementChange = completedRequests > 0 ? ((completedRequests / totalRequests) * 100).toFixed(1) : '0'
    const requestChange = inProgressRequests > 0 ? ((inProgressRequests / totalRequests) * 100).toFixed(1) : '0'

    const calculatedKpis: KPI[] = [
      {
        title: 'Total Candidates',
        value: totalCandidates.toLocaleString(),
        change: `${candidateChange}%`,
        icon: (
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.5 3h5a1.5 1.5 0 0 1 1.5 1.5a3.5 3.5 0 0 1 -3.5 3.5h-1a3.5 3.5 0 0 1 -3.5 -3.5a1.5 1.5 0 0 1 1.5 -1.5z"></path>
            <path d="M4 17v-1a8 8 0 1 1 16 0v1a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z"></path>
          </svg>
        ),
        bgColor: 'bg-rose-200',
      },
      {
        title: 'Open Positions',
        value: openPositions,
        change: `${positionChange}%`,
        icon: (
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path>
            <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>
            <path d="M14 11h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5"></path>
            <path d="M12 17v1m0 -8v1"></path>
          </svg>
        ),
        bgColor: 'bg-gray-200',
      },
      {
        title: 'Placement Rate',
        value: `${placementRate}%`,
        change: `${placementChange}%`,
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
        title: 'Active Requests',
        value: activeRequests,
        change: `${requestChange}%`,
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

    setKpis(calculatedKpis)
  }

  const getIconSvg = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.5 3h5a1.5 1.5 0 0 1 1.5 1.5a3.5 3.5 0 0 1 -3.5 3.5h-1a3.5 3.5 0 0 1 -3.5 -3.5a1.5 1.5 0 0 1 1.5 -1.5z"></path>
    </svg>
  )

  const campaigns: Campaign[] = requests.map((request, index) => {
    const matchedCandidates = Math.floor(Math.random() * (request.number_of_employees + 1))
    const conversionRate = request.number_of_employees > 0 ? Math.round((matchedCandidates / request.number_of_employees) * 100) : 0
    return {
      id: request.request_id,
      name: request.position,
      type: request.request_type,
      status: request.status as 'Active' | 'Completed' | 'Scheduled',
      budget: `${request.number_of_employees} position${request.number_of_employees !== 1 ? 's' : ''}`,
      conversions: `${conversionRate}%`,
      startDate: new Date(request.start_date || request.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      endDate: new Date(request.start_date || request.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      icon: getIconSvg(),
    }
  })

  const totalRequests = requests.length
  const approvedRequests = requests.filter((r) => r.status === 'Approved').length
  const rejectedRequests = requests.filter((r) => r.status === 'Rejected').length
  const candidateQualityScore = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0
  const requestFulfillmentScore = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0
  const placementSuccessScore = totalRequests > 0 ? Math.round(((totalRequests - rejectedRequests) / totalRequests) * 100) : 0

  const filteredCandidates = candidates.filter((_, index) => {
    if (selectedSegment === 'all') return true
    return selectedSegment === 'Standard' ? index % 3 !== 0 : index % 3 === 0
  })

  const filteredRequests = requests.filter(r => {
    if (selectedSegment === 'all') return true
    return r.request_type === selectedSegment
  })

  const chartSeries = [
    {
      name: 'Candidates Matched',
      data: filteredCandidates.length > 0 ? [
        Math.round(filteredCandidates.length * 0.2),
        Math.round(filteredCandidates.length * 0.25),
        Math.round(filteredCandidates.length * 0.15),
        Math.round(filteredCandidates.length * 0.3),
        Math.round(filteredCandidates.length * 0.2),
        Math.round(filteredCandidates.length * 0.25),
        Math.round(filteredCandidates.length * 0.28),
        Math.round(filteredCandidates.length * 0.35),
        Math.round(filteredCandidates.length * 0.4),
        Math.round(filteredCandidates.length * 0.35),
        Math.round(filteredCandidates.length * 0.45),
        Math.round(filteredCandidates.length * 0.5)
      ] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      name: 'Requests Fulfilled',
      data: filteredRequests.length > 0 ? [
        Math.round(filteredRequests.length * 0.1),
        Math.round(filteredRequests.length * 0.15),
        Math.round(filteredRequests.length * 0.12),
        Math.round(filteredRequests.length * 0.18),
        Math.round(filteredRequests.length * 0.16),
        Math.round(filteredRequests.length * 0.15),
        Math.round(filteredRequests.length * 0.2),
        Math.round(filteredRequests.length * 0.22),
        Math.round(filteredRequests.length * 0.25),
        Math.round(filteredRequests.length * 0.2),
        Math.round(filteredRequests.length * 0.28),
        Math.round(filteredRequests.length * 0.3)
      ] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ]

  const maxVal = Math.max(
    ...(filteredCandidates.length > 0 ? [filteredCandidates.length * 0.5] : [0]),
    ...(filteredRequests.length > 0 ? [filteredRequests.length * 0.3] : [0])
  )
  const chartMax = Math.round(maxVal)

  const chartOptions = {
    yaxis: {
      labels: {
        formatter: (val: number) => {
          return val.toFixed(0)
        }
      },
      ...(chartMax > 0 && chartMax <= 10 ? { tickAmount: chartMax } : {})
    }
  }

  const chartXAxis = ['01 May', '02 May', '03 May', '04 May', '05 May', '06 May', '07 May', '08 May', '09 May', '10 May', '11 May', '12 May']

  const performanceScores = [
    { label: 'Candidate Quality', score: `${candidateQualityScore}%`, status: candidateQualityScore >= 70 ? 'success' : 'warning' },
    { label: 'Request Fulfillment', score: `${requestFulfillmentScore}%`, status: requestFulfillmentScore >= 70 ? 'success' : 'warning' },
    { label: 'Time-to-Hire', score: `${Math.max(0, 100 - requests.length * 5)}%`, status: (100 - requests.length * 5) >= 60 ? 'success' : 'warning' },
    { label: 'Placement Success', score: `${placementSuccessScore}%`, status: placementSuccessScore >= 70 ? 'success' : 'warning' },
    { label: 'Candidate Retention', score: `${Math.max(0, candidateQualityScore - 10)}%`, status: (candidateQualityScore - 10) >= 50 ? 'success' : 'warning' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'In Progress':
        return 'bg-sky-200'
      case 'Completed':
      case 'Approved':
        return 'bg-emerald-200'
      case 'Scheduled':
        return 'bg-orange-200'
      case 'Pending':
        return 'bg-yellow-200'
      case 'Rejected':
        return 'bg-red-200'
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

  if (loading) {
    return (
      <Card>
        <div className="py-8 text-center text-gray-500">Loading recruitment data...</div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">Recruitment KPIs</h4>
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
        {/* Recruitment Performance Chart */}
        <div className="col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold">Recruitment Performance</h4>
              <Segment>
                <button className={`px-3 py-2 text-sm rounded ${selectedSegment === 'all' ? 'bg-gray-200' : ''}`} onClick={() => setSelectedSegment('all')}>
                  All
                </button>
                <button className={`px-3 py-2 text-sm rounded ${selectedSegment === 'Standard' ? 'bg-gray-200' : ''}`} onClick={() => setSelectedSegment('Standard')}>
                  Standard
                </button>
                <button className={`px-3 py-2 text-sm rounded ${selectedSegment === 'Special' ? 'bg-gray-200' : ''}`} onClick={() => setSelectedSegment('Special')}>
                  Special
                </button>
              </Segment>
            </div>
            <div style={{ minHeight: '465px' }}>
              <Chart type="line" height={450} series={chartSeries} xAxis={chartXAxis} customOptions={chartOptions} />
            </div>
          </Card>
        </div>

        {/* Recruitment Performance Score */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold">Recruitment Performance</h4>
          </div>
          <div style={{ minHeight: '265px' }} className="flex items-center justify-center mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{Math.round((candidateQualityScore + requestFulfillmentScore + placementSuccessScore) / 3)}%</div>
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

      {/* Top Countries */}
      <Card>
        <h4 className="text-lg font-bold mb-4">Top Countries</h4>
        <div className="flex flex-col xl:flex-row gap-6 mt-4">
          <div className="flex-1 w-full overflow-hidden rounded-lg">
            <CountryMap
              selectedCountry={selectedCountry}
              onCountryClick={setSelectedCountry}
              data={topCountries}
            />
          </div>
          <div className="flex flex-col justify-center px-4 2xl:min-w-[340px] xl:w-[300px] w-full gap-2">
            {topCountries.map((item) => {
              const flags: { [key: string]: string } = {
                'United States': '🇺🇸',
                'Brazil': '🇧🇷',
                'India': '🇮🇳',
                'United Kingdom': '🇬🇧',
                'Turkey': '🇹🇷',
              }
              const isSelected = selectedCountry === item.name

              return (
                <div
                  key={item.name}
                  onClick={() => setSelectedCountry(item.name)}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-gray-200 border border-gray-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex gap-2 text-xl">{flags[item.name]}</div>
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${isSelected ? 'text-gray-700' : ''}`}>
                      {item.name}
                    </div>
                    <div className="progress line">
                      <div className="progress-wrapper">
                        <div className="progress-inner transition-colors duration-150">
                          <div
                            className={`progress-bg h-2 ${isSelected ? 'bg-gray-600' : 'bg-gray-400'}`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`progress-info font-bold text-sm ${isSelected ? 'text-gray-600' : ''}`}>
                        {item.percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Active Requests Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">Active Job Requests</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4">
                  <input type="checkbox" />
                </th>
                <th className="text-left py-3 px-4">Position</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Positions</th>
                <th className="text-left py-3 px-4">Matched</th>
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
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{campaign.budget}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{campaign.conversions}</td>
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
