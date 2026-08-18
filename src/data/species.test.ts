import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import curated from './blends/curated.json'
import { climateBands } from './climate'
import { DEFAULT_SPECIES, defaultSpeciesId, loadedSpecies, speciesLabel, speciesList, speciesRank } from './seedDb'
import type { Blend } from '../types'

const ids = speciesList.map((s) => s.id)
const loadedIds = loadedSpecies.map((s) => s.id)

const seedDbSource = readFileSync(new URL('./seedDb.ts', import.meta.url), 'utf8')
const ingestSource = readFileSync(
  new URL('../../scripts/ntep/ingest_pdf.py', import.meta.url),
  'utf8',
)

describe('species catalog', () => {
  it('has unique snake_case ids, a label, and a season the settings menu groups by', () => {
    expect(ids).toEqual([...new Set(ids)])
    speciesList.forEach((s) => {
      expect(s.id).toMatch(/^[a-z][a-z_]*$/)
      expect(s.label.trim()).not.toBe('')
      expect(['cool', 'warm']).toContain(s.season)
    })
  })

  it('lists both seasons, so neither group in the seed-type menu is empty', () => {
    expect(speciesList.some((s) => s.season === 'cool')).toBe(true)
    expect(speciesList.some((s) => s.season === 'warm')).toBe(true)
  })

  /**
   * The glob in seedDb has to name every species literally — Vite will not take
   * a wildcard — so a species added to the catalog and not to the glob would
   * silently never load its trial data.
   */
  it('names every catalog species in the cultivar glob', () => {
    const glob = seedDbSource.match(/cultivars_\{([^}]+)\}\.json/)
    expect(glob).not.toBeNull()
    const globbed = (glob as RegExpMatchArray)[1].split(',')
    expect(globbed.slice().sort()).toEqual(ids.slice().sort())
  })

  /** species.json is generated, so the generator is the copy that has to agree. */
  it('matches SPECIES_CATALOG in the ingest script', () => {
    speciesList.forEach((s) => {
      expect(ingestSource).toContain(`"id": "${s.id}"`)
      expect(ingestSource).toContain(`"label": "${s.label}"`)
    })
    const pythonIds = [...ingestSource.matchAll(/^        "id": "([a-z_]+)",$/gm)].map((m) => m[1])
    expect(pythonIds).toEqual(ids)
  })

  it('has an ingested pack for every species that claims a trial', () => {
    speciesList
      .filter((s) => (s.ntepTrials || []).length > 0)
      .forEach((s) => expect(loadedIds).toContain(s.id))
  })

  it('says why any species without scores has none', () => {
    speciesList
      .filter((s) => !loadedIds.includes(s.id))
      .forEach((s) => expect(['schema_ready', 'no_national_trial']).toContain(s.status))
  })

  it('only scores species the catalog knows about', () => {
    loadedIds.forEach((id) => expect(ids).toContain(id))
  })
})

describe('species referenced elsewhere', () => {
  it('resolves every climate band priority to a catalog species', () => {
    Object.values(climateBands).forEach((band) => {
      band.speciesPriority.forEach((id) => expect(ids).toContain(id))
    })
  })

  it('resolves every curated bag to a species we can score', () => {
    ;(curated as Blend[]).forEach((blend) => expect(loadedIds).toContain(blend.species))
  })

  it('falls back to species that actually have trial data', () => {
    expect(loadedIds).toContain(DEFAULT_SPECIES)
    ;['cool', 'mixed', 'warm', '', null].forEach((grass) =>
      expect(loadedIds).toContain(defaultSpeciesId(grass)),
    )
  })
})

describe('species display helpers', () => {
  it('labels known ids and passes unknown ones through', () => {
    expect(speciesLabel('tall_fescue')).toBe('Tall fescue')
    expect(speciesLabel('kikuyugrass')).toBe('kikuyugrass')
  })

  it('ranks in catalog order and sorts unknown ids last', () => {
    expect(speciesRank(ids[0])).toBe(0)
    expect(speciesRank(ids[1])).toBe(1)
    expect(speciesRank('kikuyugrass')).toBe(ids.length)
  })
})
