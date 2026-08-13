import curatedBlends from '../data/blends/curated.json'
import species from '../data/ntep/species.json'
import sites from '../data/ntep/sites.json'
import { normalizeKey } from '../services/suitability'
import type { Blend, Cultivar, CultivarPack, NtepMeta, NtepSite, SpeciesInfo } from '../types'

/**
 * One ingested pack per species, keyed by species id.
 *
 * The species ids are enumerated rather than matched with `cultivars_*.json`
 * because Vite requires a static glob pattern, and an open wildcard would pull
 * any sibling file in this directory into the bundle. Keep this list in sync
 * with SPECIES_CATALOG in scripts/ntep/ingest_pdf.py.
 */
const packModules = import.meta.glob<{ default?: CultivarPack } & CultivarPack>(
  './ntep/cultivars_{tall_fescue,kentucky_bluegrass,perennial_ryegrass,fine_fescue,bermudagrass}.json',
  { eager: true },
)

const speciesListData = species as SpeciesInfo[]

const packsBySpecies = speciesListData.reduce<Record<string, CultivarPack>>((acc, s) => {
  const mod = packModules[`./ntep/cultivars_${s.id}.json`]
  if (mod) acc[s.id] = mod.default ?? mod
  return acc
}, {})

export const DEFAULT_SPECIES = 'tall_fescue'

/** Species that actually have ingested trial data, in catalog order. */
export const loadedSpecies = speciesListData.filter((s) => packsBySpecies[s.id])

export function cultivarsForSpecies(speciesId = DEFAULT_SPECIES): Cultivar[] {
  return packsBySpecies[speciesId]?.cultivars || []
}

export function ntepMetaForSpecies(speciesId = DEFAULT_SPECIES): NtepMeta | null {
  return packsBySpecies[speciesId]?.meta || null
}

const cultivarList = cultivarsForSpecies()

export function buildCultivarIndex(list: Cultivar[] = cultivarList): Record<string, Cultivar> {
  const index: Record<string, Cultivar> = {}
  list.forEach((c) => {
    index[c.id] = c
    index[normalizeKey(c.name)] = c
    ;(c.aliases || []).forEach((a) => {
      index[normalizeKey(a)] = c
    })
  })
  return index
}

export const ntepMeta = ntepMetaForSpecies()
export const allCultivars = cultivarList
export const curatedBlendList = curatedBlends as Blend[]
export const speciesList = speciesListData
export const ntepSites = sites as Record<string, NtepSite>

/**
 * Site codes a given metric was actually measured at.
 *
 * Each NTEP table covers its own subset of locations, so anything that shows a
 * per-site figure has to rank sites against the metric it is displaying.
 */
export function siteCodesForMetric(metric: string, list: Cultivar[] = cultivarList): string[] {
  const codes = new Set<string>()
  list.forEach((c) => {
    Object.keys(c.metrics?.[metric]?.bySite || {}).forEach((code) => codes.add(code))
  })
  return [...codes]
}

export function searchCultivars(query: string, list: Cultivar[] = cultivarList): Cultivar[] {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return list.slice().sort((a, b) => a.name.localeCompare(b.name))
  return list.filter((c) => {
    const blob = `${c.name} ${(c.aliases || []).join(' ')}`.toLowerCase()
    return blob.includes(q)
  })
}

export function getCultivarById(id: string, index = buildCultivarIndex()): Cultivar | null {
  return index[normalizeKey(id)] || index[id] || null
}
