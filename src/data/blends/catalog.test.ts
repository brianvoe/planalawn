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

  it('has at least five blends per climate band', () => {
    ZONES.forEach((zone) => {
      const n = catalog.filter((b) => b.zones?.includes(zone)).length
      expect(n, zone).toBeGreaterThanOrEqual(5)
    })
  })

  it('includes retail, amazon, and pro or specialty in each zone', () => {
    ZONES.forEach((zone) => {
      const inZone = catalog.filter((b) => b.zones?.includes(zone))
      const channels = new Set(inZone.map((b) => b.channel))
      expect(channels.has('retail'), `${zone} retail`).toBe(true)
      expect(channels.has('amazon'), `${zone} amazon`).toBe(true)
      expect(channels.has('pro') || channels.has('specialty'), `${zone} pro/specialty`).toBe(true)
    })
  })

  it('covers all four channels across the catalog', () => {
    const channels = new Set(catalog.map((b) => b.channel))
    expect(channels.has('retail')).toBe(true)
    expect(channels.has('amazon')).toBe(true)
    expect(channels.has('pro')).toBe(true)
    expect(channels.has('specialty')).toBe(true)
  })

  it('maps warm-zone bags to bermudagrass', () => {
    catalog
      .filter((b) => b.zones?.includes('warm'))
      .forEach((b) => {
        expect(b.species, b.id).toBe('bermudagrass')
      })
  })

  it('resolves published cultivarIds in that species NTEP index or a known gap', () => {
    catalog.forEach((blend) => {
      const index = indexFor(blend.species)
      ;(blend.components || []).forEach((c) => {
        if (!c.cultivarId) return
        const key = normalizeKey(c.cultivarId)
        const known = KNOWN_CULTIVAR_GAP_SET.has(key)
        expect(index.has(key) || index.has(c.cultivarId) || known, `${blend.id} → ${c.cultivarId}`).toBe(true)
      })
    })
  })
})
