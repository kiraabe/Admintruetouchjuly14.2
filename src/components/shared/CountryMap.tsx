import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface CountryData {
  name: string
  coordinates: [number, number]
  percentage: number
}

const countries: CountryData[] = [
  { name: 'United States', coordinates: [-95.7129, 37.0902], percentage: 38.61 },
  { name: 'Brazil', coordinates: [-51.9253, -14.2350], percentage: 32.79 },
  { name: 'India', coordinates: [78.9629, 20.5937], percentage: 26.42 },
  { name: 'United Kingdom', coordinates: [-3.4360, 55.3781], percentage: 17.42 },
  { name: 'Turkey', coordinates: [35.2433, 38.9637], percentage: 12.85 },
]

export default function CountryMap() {
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
                    fill: '#e5e7eb',
                    stroke: '#d1d5db',
                    strokeWidth: 0.75,
                    outline: 'none',
                    cursor: 'pointer',
                  },
                  hover: {
                    fill: '#bfdbfe',
                    stroke: '#60a5fa',
                    strokeWidth: 0.75,
                    outline: 'none',
                    cursor: 'pointer',
                  },
                  pressed: {
                    fill: '#3b82f6',
                    stroke: '#1e40af',
                    strokeWidth: 0.75,
                    outline: 'none',
                  },
                }}
              />
            ))
          }
        </Geographies>
        {countries.map((country) => (
          <Marker key={country.name} coordinates={country.coordinates}>
            <circle r={Math.max(3, country.percentage / 10)} fill="#3b82f6" opacity={0.8} />
            <text
              textAnchor="middle"
              y={-Math.max(3, country.percentage / 10) - 8}
              style={{
                fontSize: '10px',
                fill: '#1e40af',
                fontWeight: 'bold',
              }}
            >
              {country.percentage.toFixed(1)}%
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  )
}
