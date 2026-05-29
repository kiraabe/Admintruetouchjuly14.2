import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export interface CountryData {
  name: string
  coordinates: [number, number]
  percentage: number
}

export const countriesData: CountryData[] = [
  { name: 'United States', coordinates: [-95.7129, 37.0902], percentage: 38.61 },
  { name: 'Brazil', coordinates: [-51.9253, -14.2350], percentage: 32.79 },
  { name: 'India', coordinates: [78.9629, 20.5937], percentage: 26.42 },
  { name: 'United Kingdom', coordinates: [-3.4360, 55.3781], percentage: 17.42 },
  { name: 'Turkey', coordinates: [35.2433, 38.9637], percentage: 12.85 },
]

interface CountryMapProps {
  selectedCountry?: string
  onCountryClick?: (countryName: string) => void
}

export default function CountryMap({ selectedCountry, onCountryClick }: CountryMapProps) {
  return (
    <div className="w-full h-full min-h-64">
      <ComposableMap projection="geoMercator">
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
        {countriesData.map((country) => {
          const isSelected = selectedCountry === country.name
          const radius = Math.max(4, country.percentage / 10)

          return (
            <Marker
              key={country.name}
              coordinates={country.coordinates}
              onClick={() => onCountryClick?.(country.name)}
              style={{ cursor: 'pointer' }}
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
                y={-radius - 12}
                style={{
                  fontSize: '10px',
                  fill: isSelected ? '#dc2626' : '#1e40af',
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                }}
              >
                {country.percentage.toFixed(1)}%
              </text>
            </Marker>
          )
        })}
      </ComposableMap>
    </div>
  )
}
