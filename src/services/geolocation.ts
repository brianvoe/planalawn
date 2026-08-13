import { climateBandFromLat } from '../data/climate'
import type { ResolvedLocation } from '../types'

const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search'
const ZIPPO = 'https://api.zippopotam.us/us'

interface ZippoPlace {
  latitude: string
  longitude: string
  'place name': string
  'state abbreviation': string
  state: string
}

interface ZippoResponse {
  places?: ZippoPlace[]
}

interface OpenMeteoHit {
  name: string
  admin1?: string
  latitude: number
  longitude: number
}

interface OpenMeteoSearch {
  results?: OpenMeteoHit[]
}

export async function lookupZip(zip: string): Promise<ResolvedLocation> {
  const clean = String(zip || '').trim().slice(0, 5)
  if (!/^\d{5}$/.test(clean)) throw new Error('Enter a valid 5-digit US ZIP')
  const res = await fetch(`${ZIPPO}/${clean}`)
  if (!res.ok) throw new Error('ZIP not found')
  const data = (await res.json()) as ZippoResponse
  const place = data.places?.[0]
  if (!place) throw new Error('ZIP not found')
  const latitude = parseFloat(place.latitude)
  const longitude = parseFloat(place.longitude)
  return {
    source: 'zip',
    zip: clean,
    city: place['place name'],
    state: place['state abbreviation'],
    stateName: place.state,
    latitude,
    longitude,
    label: `${place['place name']}, ${place['state abbreviation']} ${clean}`,
    climateBand: climateBandFromLat(latitude)?.id || null,
  }
}

export async function lookupCity(query: string): Promise<ResolvedLocation[]> {
  const q = String(query || '').trim()
  if (q.length < 2) throw new Error('Enter a city name')
  const params = new URLSearchParams({
    name: q,
    count: '5',
    language: 'en',
    format: 'json',
    countryCode: 'US',
  })
  const res = await fetch(`${GEOCODE}?${params}`)
  if (!res.ok) throw new Error('City lookup failed')
  const data = (await res.json()) as OpenMeteoSearch
  const hits = data.results || []
  if (!hits.length) throw new Error('No US cities matched')
  return hits.map((h) => ({
    source: 'geocode' as const,
    city: h.name,
    state: h.admin1 || '',
    latitude: h.latitude,
    longitude: h.longitude,
    label: `${h.name}, ${h.admin1 || 'US'}`,
    climateBand: climateBandFromLat(h.latitude)?.id || null,
  }))
}

export function requestBrowserLocation(timeoutMs = 10000): Promise<ResolvedLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        resolve({
          source: 'geolocation',
          latitude,
          longitude,
          label: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
          climateBand: climateBandFromLat(latitude)?.id || null,
        })
      },
      (err) => reject(new Error(err.message || 'Location permission denied')),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 600000 },
    )
  })
}

/** Reverse-ish label via Open-Meteo reverse geocoding approximation using nearby search */
export async function enrichCoords(latitude: number, longitude: number) {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        String(Math.round(latitude * 10) / 10),
      )}&count=1&countryCode=US`,
    )
    if (!res.ok) return null
  } catch {
    /* ignore */
  }
  return {
    latitude,
    longitude,
    climateBand: climateBandFromLat(latitude)?.id || null,
  }
}
