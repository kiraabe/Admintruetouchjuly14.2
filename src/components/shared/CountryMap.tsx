import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export interface CountryData {
  name: string
  coordinates: [number, number]
  percentage: number
  candidates?: number
  partnerships?: number
}

export const countryCoordinates: { [key: string]: [number, number] } = {
  'United States': [-95.7129, 37.0902],
  'USA': [-95.7129, 37.0902],
  'US': [-95.7129, 37.0902],
  'Brazil': [-51.9253, -14.2350],
  'India': [78.9629, 20.5937],
  'United Kingdom': [-2.2426, 55.3781],
  'UK': [-2.2426, 55.3781],
  'Turkey': [35.2433, 38.9637],
  'Germany': [10.4515, 51.1657],
  'France': [2.2137, 46.2276],
  'Japan': [138.2529, 36.2048],
  'Canada': [-95.7129, 56.1304],
  'Australia': [133.7751, -25.2744],
  'China': [104.1954, 35.8617],
  'Mexico': [-102.5528, 23.6345],
  'Spain': [-3.7492, 40.4637],
  'Italy': [12.5674, 41.8719],
  'South Africa': [24.9849, -30.5595],
  'Nigeria': [8.6753, 9.0820],
  'Argentina': [-63.6167, -38.4161],
  'Indonesia': [113.9213, -2.5489],
  'Russia': [105.3188, 61.5240],
  'Singapore': [103.8198, 1.3521],
  'Dubai': [55.2708, 25.2048],
  'UAE': [53.8478, 23.4241],
  'Ethiopia': [38.3365, 9.1450],
  'Ajman': [55.4671, 25.4052],
  'Abu Dhabi': [54.3773, 24.4539],
  'Abudhabi': [54.3773, 24.4539],
  'Pakistan': [69.3451, 30.3753],
  'Thailand': [100.9925, 15.8700],
  'Malaysia': [101.6869, 4.2105],
  'Philippines': [121.7740, 12.8797],
  'Vietnam': [105.8581, 20.8517],
  'Bangladesh': [90.3563, 23.6850],
  'Sri Lanka': [80.7718, 7.8731],
  'Nepal': [84.1240, 28.3949],
  'Egypt': [30.8025, 26.8206],
  'Kenya': [37.9083, -0.0236],
  'Ghana': [-2.3577, 7.3697],
  'Uganda': [32.2903, 1.3733],
  'Tanzania': [34.8888, -6.3690],
  'Morocco': [-3.3591, 31.7917],
  'Poland': [19.1451, 51.9194],
  'Netherlands': [5.2913, 52.1326],
  'Belgium': [4.4699, 50.5039],
  'Sweden': [18.6435, 60.1282],
  'Norway': [8.4689, 60.4720],
  'Denmark': [9.5018, 56.2639],
  'Greece': [21.8243, 39.0742],
  'Portugal': [-8.2245, 39.3999],
  'Austria': [14.5501, 47.5162],
  'Switzerland': [8.2275, 46.8182],
  'Israel': [34.8516, 31.0461],
  'Saudi Arabia': [45.0792, 23.8859],
  'Kuwait': [47.4829, 29.3117],
  'Qatar': [51.1694, 25.3548],
  'Oman': [55.9754, 21.4735],
  'Jordan': [36.2384, 30.5852],
  'Lebanon': [35.8623, 33.8547],
}

export const countriesData: CountryData[] = [
  { name: 'United States', coordinates: [-95.7129, 37.0902], percentage: 38.61 },
  { name: 'Brazil', coordinates: [-51.9253, -14.2350], percentage: 32.79 },
  { name: 'India', coordinates: [78.9629, 20.5937], percentage: 26.42 },
  { name: 'United Kingdom', coordinates: [-2.2426, 55.3781], percentage: 17.42 },
  { name: 'Turkey', coordinates: [35.2433, 38.9637], percentage: 12.85 },
]

export const getCountryCoordinates = (countryName: string): [number, number] => {
  if (!countryName) return [0, 0]

  // Try exact match first
  if (countryCoordinates[countryName]) {
    return countryCoordinates[countryName]
  }

  // Try case-insensitive match
  const normalized = countryName.trim()
  for (const [key, coords] of Object.entries(countryCoordinates)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return coords
    }
  }

  // Fallback to [0, 0] for unmapped locations
  return [0, 0]
}

interface CountryMapProps {
  selectedCountry?: string
  onCountryClick?: (countryName: string) => void
  data?: CountryData[]
}

interface TooltipPosition {
  x: number
  y: number
}

export default function CountryMap({ selectedCountry, onCountryClick, data }: CountryMapProps) {
  const mapData = data || countriesData
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ x: 0, y: 0 })

  const handleMarkerHover = (e: React.MouseEvent, countryName: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltipPos({
      x: rect.x,
      y: rect.y - 50,
    })
    setHoveredCountry(countryName)
  }

  const handleMarkerLeave = () => {
    setHoveredCountry(null)
  }

  const getCountryInfo = (countryName: string) => {
    return mapData.find(c => c.name === countryName)
  }

  return (
    <div className="w-full h-96 relative flex items-center justify-center bg-gradient-to-b from-blue-50 to-white rounded-lg">
      <ComposableMap projection="geoNaturalEarth1" width={1000} height={600} style={{ width: '100%', height: '100%' }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: '#f3f4f6',
                    stroke: '#d1d5db',
                    strokeWidth: 0.75,
                    outline: 'none',
                    cursor: 'pointer',
                  },
                  hover: {
                    fill: '#e5e7eb',
                    stroke: '#9ca3af',
                    strokeWidth: 0.75,
                    outline: 'none',
                    cursor: 'pointer',
                  },
                  pressed: {
                    fill: '#d1d5db',
                    stroke: '#6b7280',
                    strokeWidth: 0.75,
                    outline: 'none',
                  },
                }}
              />
            ))
          }
        </Geographies>
        {mapData.map((country) => {
          const isSelected = selectedCountry === country.name
          const radius = Math.max(8, country.percentage / 5)

          return (
            <Marker
              key={country.name}
              coordinates={country.coordinates}
              onClick={() => onCountryClick?.(country.name)}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handleMarkerHover(e, country.name)}
              onMouseLeave={handleMarkerLeave}
            >
              <circle
                r={isSelected ? radius + 2 : radius}
                fill={isSelected ? '#6b7280' : '#9ca3af'}
                opacity={isSelected ? 1 : 0.8}
                style={{ transition: 'all 200ms ease' }}
              />
              <circle
                r={radius + 1}
                fill="none"
                stroke={isSelected ? '#ef4444' : 'transparent'}
                strokeWidth={2}
                opacity={0.5}
                style={{ transition: 'all 200ms ease' }}
              />
              <text
                textAnchor="middle"
                y={-radius - 18}
                style={{
                  fontSize: '14px',
                  fill: isSelected ? '#dc2626' : '#2563eb',
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  background: 'white',
                  paintOrder: 'stroke',
                  stroke: 'white',
                  strokeWidth: '3px',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                {country.percentage.toFixed(1)}%
              </text>
            </Marker>
          )
        })}
      </ComposableMap>

      {hoveredCountry && (
        <div
          className="absolute bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold mb-1">{hoveredCountry}</div>
          {getCountryInfo(hoveredCountry) && (
            <>
              <div className="text-gray-300">Share: {getCountryInfo(hoveredCountry)!.percentage.toFixed(2)}%</div>
              {getCountryInfo(hoveredCountry)!.candidates !== undefined && (
                <div className="text-blue-300">Candidates: {getCountryInfo(hoveredCountry)!.candidates}</div>
              )}
              {getCountryInfo(hoveredCountry)!.partnerships !== undefined && (
                <div className="text-green-300">Partnerships: {getCountryInfo(hoveredCountry)!.partnerships}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
