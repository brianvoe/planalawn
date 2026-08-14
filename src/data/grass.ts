import type { ClimateBandId, GrassType, UserLocation } from '../types'

export const grassTypeLabels: Record<GrassType, string> = {
  cool: 'Cool-season (tall fescue, bluegrass, rye)',
  mixed: 'Mixed / transition',
  warm: 'Warm-season (bermuda, zoysia, St. Augustine)',
}

export const grassTypeOptions: { id: GrassType; label: string }[] = [
  { id: 'cool', label: grassTypeLabels.cool },
  { id: 'mixed', label: grassTypeLabels.mixed },
  { id: 'warm', label: grassTypeLabels.warm },
]

/** Parse USDA strings like 7a, 7b, 6. */
export function usdaZoneNumber(zone: string | null | undefined): number | null {
  if (!zone) return null
  const n = parseInt(zone, 10)
  return Number.isFinite(n) && n >= 1 && n <= 13 ? n : null
}

/** Unset grass type: zones 3–6 cool, 7 mixed, 8+ warm. */
export function grassTypeFromUsdaZone(zone: string | null | undefined): GrassType | null {
  const n = usdaZoneNumber(zone)
  if (n == null) return null
  if (n <= 6) return 'cool'
  if (n === 7) return 'mixed'
  return 'warm'
}

export function grassTypeFromClimateBand(band: ClimateBandId | null | undefined): GrassType | null {
  if (band === 'cool') return 'cool'
  if (band === 'warm') return 'warm'
  if (band === 'transition') return 'mixed'
  return null
}

export function inferGrassType(location: Pick<UserLocation, 'usdaZone' | 'climateBand'> | null): GrassType | null {
  if (!location) return null
  return grassTypeFromUsdaZone(location.usdaZone) || grassTypeFromClimateBand(location.climateBand)
}

export function isGrassType(value: string | null | undefined): value is GrassType {
  return value === 'cool' || value === 'mixed' || value === 'warm'
}

/** Profile value wins; otherwise infer from USDA zone (then climate band). */
export function resolvedGrassType(
  profileGrass: string | null | undefined,
  location: Pick<UserLocation, 'usdaZone' | 'climateBand'> | null,
): GrassType | null {
  if (isGrassType(profileGrass)) return profileGrass
  return inferGrassType(location)
}

const grassTaskNotes: Record<string, Partial<Record<GrassType | 'any', string>>> = {
  'pre-em-spring': {
    cool: 'Cool-season: apply before crabgrass germinates. Do not seed into a treated lawn until the label wait is over.',
    mixed:
      'Transition lawns: confirm the product lists every grass you keep. Some crabgrass preventers injure bermuda.',
    warm: 'Warm-season: many labels want application at or just after spring green-up — not on fully dormant turf.',
  },
  'pre-em-fall': {
    cool: 'Cool-season: skip fall pre-em if you plan to overseed. Most preventers also block tall fescue seed.',
    mixed: 'Mixed lawns: fall pre-em vs fall overseed is the usual conflict — pick one for this season.',
    warm: 'Warm-season: fall pre-em is often for Poa / winter weeds as bermuda goes dormant. Follow the species on the label.',
  },
  'post-em-broadleaf': {
    cool: 'Cool-season: 2,4-D–type mixes are the usual broadleaf pass. Avoid spraying into hot, drought-stressed turf.',
    mixed: 'Mixed lawns: a product safe on fescue may still brown bermuda (and the reverse). Check listed species.',
    warm: 'Warm-season: use a mix labeled for bermuda/zoysia. Some cool-season 3-ways are too aggressive coming out of dormancy.',
  },
  'post-em-grassy': {
    cool: 'Cool-season: quinclorac-type products are the usual crabgrass rescue on tall fescue. Young plants die easier than clumps.',
    mixed: 'Mixed lawns: grassy-weed killers can take out bermuda in a fescue lawn (or the fescue in a bermuda lawn).',
    warm: 'Warm-season: crabgrass control in bermuda is a different label than fescue — don’t assume a cool-season bottle is safe.',
  },
  'grub-preventative': {
    any: 'Preventative products need to be down before larvae are large. Japanese beetle timing varies; the label’s window wins.',
  },
  'grub-curative': {
    any: 'Curative control is for damage you can see (scattered brown, spongy turf, animals digging). Water it in.',
  },
}

export function grassNoteForTask(taskId: string, grass: GrassType | null): string | null {
  const notes = grassTaskNotes[taskId]
  if (!notes) return null
  if (grass && notes[grass]) return notes[grass] as string
  return notes.any || null
}
