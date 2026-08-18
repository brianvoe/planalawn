import { describe, expect, it } from 'vitest'
import curated from './curated.json'
import { KNOWN_CULTIVAR_GAP_SET } from './knownGaps'
import { cultivarsForSpecies, loadedSpecies } from '../seedDb'
import { normalizeKey } from '../../services/suitability'
import type { Blend, ClimateBandId, Cultivar } from '../../types'

const ZONES: ClimateBandId[] = ['cool', 'transition', 'warm']
const HTTPS = /^https:\/\//i

/** Drawn from the loader rather than named here, so a new pack is covered. */
const packs: Record<string, Cultivar[]> = Object.fromEntries(
  loadedSpecies.map((s) => [s.id, cultivarsForSpecies(s.id)]),
)

const seasonOf: Record<string, string> = Object.fromEntries(
  loadedSpecies.map((s) => [s.id, s.season]),
)

/**
 * Every key the app can resolve a component against, across all ingested
 * species — mixtures put a bluegrass on a fescue tag, and the app scores those
 * from the bluegrass trial rather than skipping them.
 */
function resolvableKeys(): Set<string> {
  const keys = new Set<string>()
  Object.values(packs)
    .flat()
    .forEach((c) => {
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
      if (blend.form) expect(['seed', 'sod'], blend.id).toContain(blend.form)
    })
  })

  /**
   * Sod is a single clone cut from a field, so a bag-style mixture cannot
   * exist. Every species sold this way is warm-season: bermuda, zoysia and
   * St. Augustine are all planted vegetatively rather than seeded.
   */
  it('only sells sod as a single warm-season vegetative variety', () => {
    catalog
      .filter((b) => b.form === 'sod')
      .forEach((blend) => {
        expect(seasonOf[blend.species], blend.id).toBe('warm')
        expect(blend.components.length, blend.id).toBe(1)
      })
  })

  it('has at least three blends per climate band', () => {
    ZONES.forEach((zone) => {
      const n = catalog.filter((b) => b.zones?.includes(zone)).length
      expect(n, zone).toBeGreaterThanOrEqual(3)
    })
  })

  /**
   * A bag sold into a climate band has to be a grass that survives it. Warm
   * species reach up into the transition zone and tall fescue reaches down,
   * but nothing warm-season belongs in a cool-season listing.
   */
  it('sells each bag only into bands its species survives', () => {
    catalog.forEach((b) => {
      const season = seasonOf[b.species]
      expect(season, `${b.id} → unscored species ${b.species}`).toBeTruthy()
      if (b.zones?.includes('cool')) expect(season, b.id).toBe('cool')
      if (season === 'cool') expect(b.zones, b.id).not.toContain('warm')
    })
  })

  it('resolves every cultivarId in an ingested NTEP index or a known gap', () => {
    const index = resolvableKeys()
    catalog.forEach((blend) => {
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

  /**
   * A score is only worth showing if it describes most of the bag. Plenty of
   * real products name every cultivar but draw them from trial cycles we do not
   * hold, which leaves a headline number resting on a quarter of the seed —
   * worse than saying nothing. Weighted by label percentage where published,
   * counted evenly where not.
   */
  it('scores at least half of every bag from trial data', () => {
    const index = resolvableKeys()
    catalog.forEach((blend) => {
      const comps = blend.components
      const mapped = comps.filter((c) => index.has(normalizeKey(c.cultivarId || '')))
      const pct = (list: typeof comps) => list.reduce((s, c) => s + (c.percent || 0), 0)
      const share = comps.every((c) => typeof c.percent === 'number')
        ? pct(mapped) / (pct(comps) || 1)
        : mapped.length / comps.length
      expect(share, `${blend.id} only scores ${Math.round(share * 100)}% of the bag`)
        .toBeGreaterThanOrEqual(0.5)
    })
  })

  it('keeps the known-gap list free of cultivars we have since ingested', () => {
    const index = resolvableKeys()
    const stale = [...KNOWN_CULTIVAR_GAP_SET].filter((key) => index.has(key))
    expect(stale, `now in an NTEP pack — drop from knownGaps: ${stale.join(', ')}`).toEqual([])
  })
})
