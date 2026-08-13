import type { Conditions, UserLocation } from '../types'

const CACHE_KEY = 'grass.weather.v1'
const CACHE_MS = 45 * 60 * 1000

interface CachedPayload {
  fetchedAt: number
  data: Omit<Conditions, 'fromCache'>
}

interface OpenMeteoCurrent {
  temperature_2m?: number
  precipitation?: number
  soil_temperature_0cm?: number
  soil_temperature_6cm?: number
  soil_temperature_18cm?: number
}

interface OpenMeteoHourly {
  precipitation?: number[]
}

interface OpenMeteoForecast {
  current?: OpenMeteoCurrent
  hourly?: OpenMeteoHourly
}

function average(values: unknown[]): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))
  if (!nums.length) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function cacheKeyFor(lat: number, lon: number): string {
  return `${CACHE_KEY}:${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`
}

function readCache(lat: number, lon: number): Omit<Conditions, 'fromCache'> | null {
  try {
    const raw = localStorage.getItem(cacheKeyFor(lat, lon))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedPayload
    if (!parsed?.fetchedAt || Date.now() - parsed.fetchedAt > CACHE_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(lat: number, lon: number, data: Omit<Conditions, 'fromCache'>): void {
  try {
    localStorage.setItem(cacheKeyFor(lat, lon), JSON.stringify({ fetchedAt: Date.now(), data }))
  } catch {
    /* ignore */
  }
}

/**
 * Fetch conditions from Open-Meteo for arbitrary US coordinates.
 * Soil temp at 6cm is the primary seeding signal.
 */
export async function fetchConditions(
  location: Pick<UserLocation, 'latitude' | 'longitude' | 'label' | 'city'> | null,
  options: { force?: boolean } = {},
): Promise<Conditions> {
  const force = Boolean(options.force)
  const latitude = location?.latitude
  const longitude = location?.longitude
  if (!location || typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Set your location to load local soil temperature')
  }

  if (!force) {
    const cached = readCache(latitude, longitude)
    if (cached) return { ...cached, fromCache: true }
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    timezone: 'auto',
    current: [
      'temperature_2m',
      'precipitation',
      'soil_temperature_0cm',
      'soil_temperature_6cm',
      'soil_temperature_18cm',
    ].join(','),
    hourly: ['temperature_2m', 'precipitation', 'soil_temperature_6cm'].join(','),
    past_days: '2',
    forecast_days: '3',
  })

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`)

  const json = (await res.json()) as OpenMeteoForecast
  const current = json.current || {}
  const hourly = json.hourly || {}
  const precipSeries = hourly.precipitation || []
  const recentPrecip = average(precipSeries.slice(-24))

  const data: Omit<Conditions, 'fromCache'> = {
    locationName: location.label || location.city || 'Your lawn',
    fetchedAt: Date.now(),
    latitude,
    longitude,
    airTempF: typeof current.temperature_2m === 'number' ? current.temperature_2m : null,
    soilTemp0F: typeof current.soil_temperature_0cm === 'number' ? current.soil_temperature_0cm : null,
    soilTemp6F: typeof current.soil_temperature_6cm === 'number' ? current.soil_temperature_6cm : null,
    soilTemp18F:
      typeof current.soil_temperature_18cm === 'number' ? current.soil_temperature_18cm : null,
    precipInch: typeof current.precipitation === 'number' ? current.precipitation : null,
    precipRecent24hInch: typeof recentPrecip === 'number' ? Number(recentPrecip.toFixed(2)) : null,
  }

  writeCache(latitude, longitude, data)
  return { ...data, fromCache: false }
}

export function formatTemp(f: number | null | undefined): string {
  if (typeof f !== 'number') return '—'
  return `${Math.round(f)}°F`
}

export function formatUpdated(ts: number | null | undefined): string {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
