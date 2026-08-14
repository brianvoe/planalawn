import { describe, expect, it } from 'vitest'
import curated from './curated.json'
import { KNOWN_CULTIVAR_GAP_SET } from './knownGaps'
import bermudaPack from '../ntep/cultivars_bermudagrass.json'
import tallFescuePack from '../ntep/cultivars_tall_fescue.json'
import { normalizeKey } from '../../services/suitability'
import type { Blend, ClimateBandId, Cultivar } from '../../types'

const ZONES: ClimateBandId[] = ['cool', 'transition', 'warm']
const HTTPS = /^https:\/\//i

const packs: Record<string, Cultivar[]> = {
  tall_fescue: tallFescuePack.cultivars,
  bermudagrass: bermudaPack.cultivars,
}

function indexFor(species: string): Set<string> {
  const keys = new Set<string>()
  ;(packs[species] || []).forEach((c) => {
    keys.add(c.id)
    keys.add(normalizeKey(c.name))
    ;(c.aliases || []).forEach((a) => keys.add(normalizeKey(a)))
  })
  return keys
}

const catalog = curated as Blend[]

describe('curated blend catalog', () => {
  it('has unique ids', () => {
    const ids = catalog.map((b) => b.id)
    expect(ids).toEqual([...new Set(ids)])
  })

  it('requires shoppable https urls, zones, and a channel on every curated blend', () => {
    catalog.forEach((blend) => {
      expect(blend.curated, blend.id).toBe(true)
      expect(blend.url, blend.id).toMatch(HTTPS)
      expect(blend.companyUrl, blend.id).toMatch(HTTPS)
      expect(blend.zones?.length, blend.id).toBeGreaterThan(0)
      blend.zones?.forEach((z) => expect(ZONES, blend.id).toContain(z))
      expect(['retail', 'pro', 'specialty', 'amazon'], blend.id).toContain(blend.channel)
    })
  })

  it('has at least three blends per climate band', () => {
    ZONES.forEach((zone) => {
      const n = catalog.filter((b) => b.zones?.includes(zone)).length
      expect(n, zone).toBeGreaterThanOrEqual(3)
    })
  })

  it('maps warm-only bags to bermudagrass and cool/transition bags to tall fescue', () => {
    catalog.forEach((b) => {
      if (b.zones?.includes('warm') && !b.zones.includes('cool')) {
        expect(b.species, b.id).toBe('bermudagrass')
      }
      if (b.zones?.includes('cool') || (b.zones?.includes('transition') && b.species !== 'bermudagrass')) {
        expect(b.species, b.id).toBe('tall_fescue')
      }
    })
  })

  it('resolves every cultivarId in that species NTEP index or a known gap', () => {
    catalog.forEach((blend) => {
      const index = indexFor(blend.species)
      expect(blend.components?.length, blend.id).toBeGreaterThan(0)
      let ntepHits = 0
      blend.components.forEach((c) => {
        expect(c.cultivarId, `${blend.id} missing cultivarId`).toBeTruthy()
        const key = normalizeKey(c.cultivarId)
        const inNtep = index.has(key) || index.has(c.cultivarId || '')
        const known = KNOWN_CULTIVAR_GAP_SET.has(key)
        expect(inNtep || known, `${blend.id} → ${c.cultivarId}`).toBe(true)
        if (inNtep) ntepHits += 1
      })
      expect(ntepHits, `${blend.id} needs at least one NTEP-mapped cultivar`).toBeGreaterThan(0)
    })
  })
})
