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

/** Warm lawns score bermuda; cool and mixed/transition score tall fescue. */
export function defaultSpeciesId(grassType: string | null | undefined): string {
  return grassType === 'warm' ? 'bermudagrass' : DEFAULT_SPECIES
}

export function buildCultivarIndex(list: Cultivar[]): Record<string, Cultivar> {
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

const indexesBySpecies: Record<string, Record<string, Cultivar>> = {}
loadedSpecies.forEach((s) => {
  indexesBySpecies[s.id] = buildCultivarIndex(cultivarsForSpecies(s.id))
})

export function indexForSpecies(speciesId = DEFAULT_SPECIES): Record<string, Cultivar> {
  return indexesBySpecies[speciesId] || buildCultivarIndex(cultivarsForSpecies(speciesId))
}

/**
 * Lookup index for a bag's components, spanning every ingested species.
 *
 * Plenty of real bags are mixtures — a fescue blend with 10% bluegrass in it —
 * so resolving components against the bag's own species alone would leave those
 * rows unscored even when we hold their trial data. The bag's own species is
 * merged last so it wins any name collision between trials.
 */
const blendIndexes: Record<string, Record<string, Cultivar>> = {}
export function indexForBlend(speciesId = DEFAULT_SPECIES): Record<string, Cultivar> {
  if (!blendIndexes[speciesId]) {
    const merged: Record<string, Cultivar> = {}
    loadedSpecies
      .filter((s) => s.id !== speciesId)
      .forEach((s) => Object.assign(merged, indexForSpecies(s.id)))
    blendIndexes[speciesId] = Object.assign(merged, indexForSpecies(speciesId))
  }
  return blendIndexes[speciesId]
}

const cultivarList = cultivarsForSpecies()
const everyCultivar = loadedSpecies.flatMap((s) => cultivarsForSpecies(s.id))

export const ntepMeta = ntepMetaForSpecies()
export const allCultivars = cultivarList
export const cultivarCount = everyCultivar.length
export const curatedBlendList = curatedBlends as Blend[]
export const speciesList = speciesListData
export const ntepSites = sites as Record<string, NtepSite>

export const NTEP_METRICS = [
  { key: 'transitionQuality', label: 'Transition quality', short: 'Transition' },
  { key: 'droughtQuality', label: 'Drought quality', short: 'Drought' },
  { key: 'brownPatch', label: 'Brown patch', short: 'Brown patch' },
  { key: 'geneticColor', label: 'Genetic color', short: 'Color' },
  { key: 'nationalMeanQuality', label: 'National mean quality', short: 'National' },
] as const

export type NtepMetricKey = (typeof NTEP_METRICS)[number]['key']

const EXPERIMENTAL_ENTRY =
  /(ppg-|pst-|dlfps-|ast\d|atf\d|rad-|nai-|k18-|jt[\s-]\d|nt-3|se5star|setfm|og-walk|^3b2$|^5lss$|bar[\s-]?(fa|pp)|^fb[\s-]?\d|^jsc[\s-]|msb-|okc\d|oks\d|^a\d\d-\d|^akb\d|^j-\d|^kh\d|^mvs-\d|^nk-\d)/i

/** Named grasses you can ask a dealer for — not experimental entry codes. */
export function isNamedCultivar(cultivar: Pick<Cultivar, 'id' | 'name'>): boolean {
  return !EXPERIMENTAL_ENTRY.test(cultivar.id) && !EXPERIMENTAL_ENTRY.test(cultivar.name)
}

export function metricMean(cultivar: Cultivar, key: string): number | null {
  const value = cultivar.metrics?.[key]?.mean
  return typeof value === 'number' ? value : null
}

export function siteLabel(code: string): string {
  const site = ntepSites[code]
  return site ? `${site.name}` : code
}

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

export function getCultivarById(id: string, index = indexForSpecies()): Cultivar | null {
  return index[normalizeKey(id)] || index[id] || null
}
