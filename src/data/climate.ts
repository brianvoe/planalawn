import type { ClimateBand, ClimateBandId } from '../types'

/**
 * US climate bands for cool-season lawn guidance + NTEP site matching.
 * Simplified USDA-inspired bands — not a full hardiness-zone engine.
 */

export const climateBands: Record<ClimateBandId, ClimateBand> = {
  cool: {
    id: 'cool',
    label: 'Cool-season core',
    shortLabel: 'Cool',
    summary: 'Strong cool-season turf climate. Tall fescue, KY bluegrass, and rye mixes are common.',
    speciesPriority: ['kentucky_bluegrass', 'tall_fescue', 'fine_fescue', 'perennial_ryegrass'],
  },
  transition: {
    id: 'transition',
    label: 'Transition zone',
    shortLabel: 'Transition',
    summary:
      'Summers stress cool-season grasses. Tall fescue is often the best cool-season choice; regional NTEP matters.',
    speciesPriority: ['tall_fescue', 'kentucky_bluegrass', 'bermudagrass', 'perennial_ryegrass'],
  },
  warm: {
    id: 'warm',
    label: 'Warm-season core',
    shortLabel: 'Warm',
    summary:
      'Warm-season grasses dominate. Cool-season tall fescue is usually limited to shade or higher elevations.',
    speciesPriority: ['bermudagrass', 'tall_fescue'],
  },
}

/** Rough lat bands for contiguous US — refined later with ZIP climate data */
export function climateBandFromLat(lat: number | null | undefined): ClimateBand | null {
  if (typeof lat !== 'number') return null
  if (lat >= 42) return climateBands.cool
  if (lat >= 35) return climateBands.transition
  return climateBands.warm
}

export const soilDepthLabel = '6 cm (~2.4 in)'

export function zoneLine(location: {
  climateBand?: ClimateBandId | null
  usdaZone?: string | null
  latitude?: number | null
} | null | undefined): string {
  if (!location) return ''
  const band = location.climateBand
    ? climateBands[location.climateBand]
    : climateBandFromLat(location.latitude)
  const parts: string[] = []
  if (band) parts.push(band.shortLabel)
  if (location.usdaZone) parts.push(location.usdaZone)
  return parts.join(' · ')
}
