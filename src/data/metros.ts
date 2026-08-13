import { climateBandFromLat } from './climate'
import type { ClimateBandId, LocationSource, ResolvedLocation } from '../types'

export interface Metro {
  id: string
  name: string
  state: string
  lat: number
  lon: number
  usdaZone: string
}

/** Largest US cities plus at least one per state so GPS always snaps to a real metro. USDA zones are 2023 map, city center. */
export const metros: Metro[] = [
  { id: 'ak-anchorage', name: 'Anchorage', state: 'AK', lat: 61.2181, lon: -149.9003, usdaZone: '4b' },
  { id: 'al-birmingham', name: 'Birmingham', state: 'AL', lat: 33.5207, lon: -86.8025, usdaZone: '8a' },
  { id: 'ar-little-rock', name: 'Little Rock', state: 'AR', lat: 34.7465, lon: -92.2896, usdaZone: '8a' },
  { id: 'az-phoenix', name: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.074, usdaZone: '9b' },
  { id: 'az-tucson', name: 'Tucson', state: 'AZ', lat: 32.2226, lon: -110.9747, usdaZone: '9a' },
  { id: 'ca-fresno', name: 'Fresno', state: 'CA', lat: 36.7378, lon: -119.7871, usdaZone: '9b' },
  { id: 'ca-los-angeles', name: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437, usdaZone: '10b' },
  { id: 'ca-sacramento', name: 'Sacramento', state: 'CA', lat: 38.5816, lon: -121.4944, usdaZone: '9b' },
  { id: 'ca-san-diego', name: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611, usdaZone: '10a' },
  { id: 'ca-san-francisco', name: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194, usdaZone: '10a' },
  { id: 'ca-san-jose', name: 'San Jose', state: 'CA', lat: 37.3382, lon: -121.8863, usdaZone: '9b' },
  { id: 'co-colorado-springs', name: 'Colorado Springs', state: 'CO', lat: 38.8339, lon: -104.8214, usdaZone: '6a' },
  { id: 'co-denver', name: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903, usdaZone: '6a' },
  { id: 'ct-hartford', name: 'Hartford', state: 'CT', lat: 41.7658, lon: -72.6734, usdaZone: '6b' },
  { id: 'dc-washington', name: 'Washington', state: 'DC', lat: 38.9072, lon: -77.0369, usdaZone: '7b' },
  { id: 'de-wilmington', name: 'Wilmington', state: 'DE', lat: 39.7391, lon: -75.5398, usdaZone: '7b' },
  { id: 'fl-jacksonville', name: 'Jacksonville', state: 'FL', lat: 30.3322, lon: -81.6557, usdaZone: '9a' },
  { id: 'fl-miami', name: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918, usdaZone: '11a' },
  { id: 'fl-orlando', name: 'Orlando', state: 'FL', lat: 28.5383, lon: -81.3792, usdaZone: '9b' },
  { id: 'fl-tampa', name: 'Tampa', state: 'FL', lat: 27.9506, lon: -82.4572, usdaZone: '10a' },
  { id: 'ga-atlanta', name: 'Atlanta', state: 'GA', lat: 33.749, lon: -84.388, usdaZone: '8a' },
  { id: 'ga-savannah', name: 'Savannah', state: 'GA', lat: 32.0809, lon: -81.0912, usdaZone: '8b' },
  { id: 'hi-honolulu', name: 'Honolulu', state: 'HI', lat: 21.3069, lon: -157.8583, usdaZone: '12b' },
  { id: 'ia-des-moines', name: 'Des Moines', state: 'IA', lat: 41.5868, lon: -93.625, usdaZone: '5b' },
  { id: 'id-boise', name: 'Boise', state: 'ID', lat: 43.615, lon: -116.2023, usdaZone: '7a' },
  { id: 'il-chicago', name: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298, usdaZone: '6a' },
  { id: 'in-indianapolis', name: 'Indianapolis', state: 'IN', lat: 39.7684, lon: -86.1581, usdaZone: '6a' },
  { id: 'ks-wichita', name: 'Wichita', state: 'KS', lat: 37.6872, lon: -97.3301, usdaZone: '7a' },
  { id: 'ky-louisville', name: 'Louisville', state: 'KY', lat: 38.2527, lon: -85.7585, usdaZone: '7a' },
  { id: 'la-baton-rouge', name: 'Baton Rouge', state: 'LA', lat: 30.4515, lon: -91.1871, usdaZone: '9a' },
  { id: 'la-new-orleans', name: 'New Orleans', state: 'LA', lat: 29.9511, lon: -90.0715, usdaZone: '9b' },
  { id: 'ma-boston', name: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589, usdaZone: '6b' },
  { id: 'md-baltimore', name: 'Baltimore', state: 'MD', lat: 39.2904, lon: -76.6122, usdaZone: '7b' },
  { id: 'me-portland', name: 'Portland', state: 'ME', lat: 43.6591, lon: -70.2568, usdaZone: '6a' },
  { id: 'mi-detroit', name: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458, usdaZone: '6b' },
  { id: 'mi-grand-rapids', name: 'Grand Rapids', state: 'MI', lat: 42.9634, lon: -85.6681, usdaZone: '6a' },
  { id: 'mn-minneapolis', name: 'Minneapolis', state: 'MN', lat: 44.9778, lon: -93.265, usdaZone: '5a' },
  { id: 'mo-kansas-city', name: 'Kansas City', state: 'MO', lat: 39.0997, lon: -94.5786, usdaZone: '6b' },
  { id: 'mo-st-louis', name: 'St. Louis', state: 'MO', lat: 38.627, lon: -90.1994, usdaZone: '6b' },
  { id: 'ms-jackson', name: 'Jackson', state: 'MS', lat: 32.2988, lon: -90.1848, usdaZone: '8b' },
  { id: 'mt-billings', name: 'Billings', state: 'MT', lat: 45.7833, lon: -108.5007, usdaZone: '4b' },
  { id: 'nc-charlotte', name: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431, usdaZone: '8a' },
  { id: 'nc-raleigh', name: 'Raleigh', state: 'NC', lat: 35.7796, lon: -78.6382, usdaZone: '8a' },
  { id: 'nd-fargo', name: 'Fargo', state: 'ND', lat: 46.8772, lon: -96.7898, usdaZone: '4a' },
  { id: 'ne-omaha', name: 'Omaha', state: 'NE', lat: 41.2565, lon: -95.9345, usdaZone: '5b' },
  { id: 'nh-manchester', name: 'Manchester', state: 'NH', lat: 42.9956, lon: -71.4548, usdaZone: '5b' },
  { id: 'nj-newark', name: 'Newark', state: 'NJ', lat: 40.7357, lon: -74.1724, usdaZone: '7a' },
  { id: 'nm-albuquerque', name: 'Albuquerque', state: 'NM', lat: 35.0844, lon: -106.6504, usdaZone: '7b' },
  { id: 'nv-las-vegas', name: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398, usdaZone: '9a' },
  { id: 'nv-reno', name: 'Reno', state: 'NV', lat: 39.5296, lon: -119.8138, usdaZone: '7a' },
  { id: 'ny-buffalo', name: 'Buffalo', state: 'NY', lat: 42.8864, lon: -78.8784, usdaZone: '6a' },
  { id: 'ny-new-york', name: 'New York', state: 'NY', lat: 40.7128, lon: -74.006, usdaZone: '7b' },
  { id: 'oh-cincinnati', name: 'Cincinnati', state: 'OH', lat: 39.1031, lon: -84.512, usdaZone: '6b' },
  { id: 'oh-cleveland', name: 'Cleveland', state: 'OH', lat: 41.4993, lon: -81.6944, usdaZone: '6b' },
  { id: 'oh-columbus', name: 'Columbus', state: 'OH', lat: 39.9612, lon: -82.9988, usdaZone: '6a' },
  { id: 'ok-oklahoma-city', name: 'Oklahoma City', state: 'OK', lat: 35.4676, lon: -97.5164, usdaZone: '7b' },
  { id: 'ok-tulsa', name: 'Tulsa', state: 'OK', lat: 36.154, lon: -95.9928, usdaZone: '7a' },
  { id: 'or-portland', name: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784, usdaZone: '8b' },
  { id: 'pa-philadelphia', name: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652, usdaZone: '7b' },
  { id: 'pa-pittsburgh', name: 'Pittsburgh', state: 'PA', lat: 40.4406, lon: -79.9959, usdaZone: '6b' },
  { id: 'ri-providence', name: 'Providence', state: 'RI', lat: 41.824, lon: -71.4128, usdaZone: '6b' },
  { id: 'sc-charleston', name: 'Charleston', state: 'SC', lat: 32.7765, lon: -79.9311, usdaZone: '8b' },
  { id: 'sc-columbia', name: 'Columbia', state: 'SC', lat: 34.0007, lon: -81.0348, usdaZone: '8a' },
  { id: 'sd-sioux-falls', name: 'Sioux Falls', state: 'SD', lat: 43.546, lon: -96.7313, usdaZone: '5a' },
  { id: 'tn-knoxville', name: 'Knoxville', state: 'TN', lat: 35.9606, lon: -83.9207, usdaZone: '7b' },
  { id: 'tn-memphis', name: 'Memphis', state: 'TN', lat: 35.1495, lon: -90.049, usdaZone: '8a' },
  { id: 'tn-nashville', name: 'Nashville', state: 'TN', lat: 36.1627, lon: -86.7816, usdaZone: '7a' },
  { id: 'tx-austin', name: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431, usdaZone: '8b' },
  { id: 'tx-dallas', name: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.797, usdaZone: '8b' },
  { id: 'tx-el-paso', name: 'El Paso', state: 'TX', lat: 31.7619, lon: -106.485, usdaZone: '8a' },
  { id: 'tx-houston', name: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698, usdaZone: '9a' },
  { id: 'tx-san-antonio', name: 'San Antonio', state: 'TX', lat: 29.4241, lon: -98.4936, usdaZone: '9a' },
  { id: 'ut-salt-lake-city', name: 'Salt Lake City', state: 'UT', lat: 40.7608, lon: -111.891, usdaZone: '7a' },
  { id: 'va-norfolk', name: 'Norfolk', state: 'VA', lat: 36.8508, lon: -76.2859, usdaZone: '8a' },
  { id: 'va-richmond', name: 'Richmond', state: 'VA', lat: 37.5407, lon: -77.436, usdaZone: '7b' },
  { id: 'vt-burlington', name: 'Burlington', state: 'VT', lat: 44.4759, lon: -73.2121, usdaZone: '5a' },
  { id: 'wa-seattle', name: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321, usdaZone: '8b' },
  { id: 'wa-spokane', name: 'Spokane', state: 'WA', lat: 47.6588, lon: -117.426, usdaZone: '6b' },
  { id: 'wi-madison', name: 'Madison', state: 'WI', lat: 43.0731, lon: -89.4012, usdaZone: '5b' },
  { id: 'wi-milwaukee', name: 'Milwaukee', state: 'WI', lat: 43.0389, lon: -87.9065, usdaZone: '5b' },
  { id: 'wv-charleston', name: 'Charleston', state: 'WV', lat: 38.3498, lon: -81.6326, usdaZone: '7a' },
  { id: 'wy-cheyenne', name: 'Cheyenne', state: 'WY', lat: 41.14, lon: -104.8202, usdaZone: '5b' },
]

export function metroById(id: string | null | undefined): Metro | null {
  if (!id) return null
  return metros.find((m) => m.id === id) || null
}

export function metroLabel(metro: Metro): string {
  return `${metro.name}, ${metro.state}`
}

export function climateIdForMetro(metro: Metro): ClimateBandId | null {
  return climateBandFromLat(metro.lat)?.id || null
}

export function locationFromMetro(metro: Metro, source: LocationSource): ResolvedLocation {
  return {
    source,
    metroId: metro.id,
    zip: '',
    city: metro.name,
    state: metro.state,
    label: metroLabel(metro),
    latitude: metro.lat,
    longitude: metro.lon,
    climateBand: climateIdForMetro(metro),
    usdaZone: metro.usdaZone,
  }
}

export function nearestMetro(lat: number, lon: number): Metro {
  let best = metros[0]
  let bestD = Infinity
  for (const metro of metros) {
    const d = haversineKm(lat, lon, metro.lat, metro.lon)
    if (d < bestD) {
      bestD = d
      best = metro
    }
  }
  return best
}

export function slimSelectData(): { text: string; value: string }[] {
  return [...metros]
    .sort((a, b) => a.name.localeCompare(b.name) || a.state.localeCompare(b.state))
    .map((m) => ({ text: metroLabel(m), value: m.id }))
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(a))
}
