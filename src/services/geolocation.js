import { climateBandFromLat } from '../data/climate'

const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search'
const ZIPPO = 'https://api.zippopotam.us/us'

export async function lookupZip(zip) {
  const clean = String(zip || '').trim().slice(0, 5)
  if (!/^\d{5}$/.test(clean)) throw new Error('Enter a valid 5-digit US ZIP')
  const res = await fetch(`${ZIPPO}/${clean}`)
  if (!res.ok) throw new Error('ZIP not found')
  const data = await res.json()
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

export async function lookupCity(query) {
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
  const data = await res.json()
  const hits = data.results || []
  if (!hits.length) throw new Error('No US cities matched')
  return hits.map((h) => ({
    source: 'geocode',
    city: h.name,
    state: h.admin1 || '',
    latitude: h.latitude,
    longitude: h.longitude,
    label: `${h.name}, ${h.admin1 || 'US'}`,
    climateBand: climateBandFromLat(h.latitude)?.id || null,
  }))
}

export function requestBrowserLocation(timeoutMs = 10000) {
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
export async function enrichCoords(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    count: '1',
    language: 'en',
    format: 'json',
  })
  // Open-Meteo doesn't have classic reverse; use nearest place search by lat as name fallback
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        String(Math.round(latitude * 10) / 10),
      )}&count=1&countryCode=US`,
    )
    // Keep coords authoritative; optional label enrichment skipped if weak
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
