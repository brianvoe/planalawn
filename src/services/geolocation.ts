import { locationFromMetro, metroById, nearestMetro } from '../data/metros'
import type { ResolvedLocation, UserLocation } from '../types'

export function requestBrowserLocation(timeoutMs = 10000): Promise<ResolvedLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        resolve(locationFromMetro(nearestMetro(latitude, longitude), 'geolocation'))
      },
      (err) => reject(new Error(err.message || 'Location permission denied')),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 600000 },
    )
  })
}

/** Snap a stored location (GPS coords, old ZIP, etc.) onto the nearest curated metro. */
export function snapToMetro(location: UserLocation | ResolvedLocation | null | undefined): ResolvedLocation | null {
  if (!location) return null
  const known = metroById('metroId' in location ? location.metroId : undefined)
  if (known) return locationFromMetro(known, location.source || 'metro')
  if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') return null
  return locationFromMetro(nearestMetro(location.latitude, location.longitude), location.source || 'metro')
}
