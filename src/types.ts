export type StatusTone = 'good' | 'caution' | 'cold' | 'hot' | 'neutral'
export type Bucket = 'now' | 'soon' | 'later'
export type ClimateBandId = 'cool' | 'transition' | 'warm'
export type LocationSource = 'zip' | 'geocode' | 'geolocation' | 'metro'
export type MixMode = 'perGallon' | 'per1000'
export type CalculatorType = 'sprayer' | 'coverage' | 'volume'
export type GrassType = 'cool' | 'mixed' | 'warm'

export interface ClimateBand {
  id: ClimateBandId
  label: string
  shortLabel: string
  summary: string
  speciesPriority: string[]
}

export interface UserLocation {
  source: LocationSource | null
  zip: string
  city: string
  state: string
  stateName?: string
  label: string
  latitude: number | null
  longitude: number | null
  climateBand: ClimateBandId | null
  metroId: string | null
  usdaZone: string | null
  promptDismissed: boolean
}

export interface ResolvedLocation {
  source: LocationSource
  zip?: string
  city?: string
  state?: string
  stateName?: string
  label: string
  latitude: number
  longitude: number
  climateBand: ClimateBandId | null
  metroId?: string
  usdaZone?: string | null
}

export interface Conditions {
  locationName: string
  fetchedAt: number
  latitude: number
  longitude: number
  airTempF: number | null
  soilTemp0F: number | null
  soilTemp6F: number | null
  soilTemp18F: number | null
  precipInch: number | null
  precipRecent24hInch: number | null
  fromCache: boolean
}

export interface TaskCalculator {
  type: CalculatorType
  rateKey: string
  altRateKey?: string
  rateKeys?: string[]
}

export interface Task {
  id: string
  name: string
  category: string
  summary: string
  why: string
  prerequisites: string[]
  nextTasks: string[]
  steps: string[]
  materials: string[]
  calculator: TaskCalculator | null
  caveats: string[]
}

export interface TimingRule {
  months: number[]
  secondaryMonths: number[]
  soilMinF: number | null
  soilMaxF: number | null
  note: string
}

export interface SoilGate {
  ok: boolean | null
  tone: StatusTone
  label: string
  detail: string
}

export interface EvaluatedTask {
  task: Task
  rule: TimingRule
  bucket: Bucket
  reason: string
  primary: boolean
  secondary: boolean
  soil: SoilGate
  months: number[]
  secondaryMonths: number[]
}

export interface WindowStatus {
  status: 'unknown' | 'open' | 'approaching' | 'closed'
  tone: StatusTone
  label: string
  detail: string
}

export interface RateTemplate {
  id: string
  label: string
  notes: string
  unit?: string
  per1000?: number
  range?: [number, number]
  mixMode?: MixMode
  ozPerGallon?: number
  ozPer1000?: number
  rangeOzPerGallon?: [number, number]
  depthInches?: number
}

export type ProductForm = 'liquid' | 'granular'
export type WaterIn = 'yes' | 'no' | 'either'
/** Sprayables are dosed by volume, except the dry ones that go by weight. */
export type LiquidMeasure = 'fl oz' | 'oz wt'
/**
 * Which units the sprayer numbers are shown in.
 *
 * Labels are printed in US units and the catalog stores them that way, so this
 * only decides what you read — plenty of people measure a tank in millilitres.
 */
export type SprayUnits = 'us' | 'metric'

/**
 * A spreader as the setting tables name it.
 *
 * Labels publish one setting per spreader family rather than per model — every
 * Scotts rotary shares a column — so these entries mirror the columns, and
 * `models` is there to help you find yours.
 */
export interface Spreader {
  id: string
  name: string
  brand: string
  type: 'rotary' | 'drop' | 'handheld'
  /** Model names that read this column. */
  models: string
  /** Typical throw width, feet — a starting guess for calibration only. */
  swathFt: number
}

/**
 * A dial setting for one spreader, copied from a published table.
 *
 * Settings are never derived: dials differ between models, so a number that
 * isn't printed for your spreader is a guess that could burn a lawn.
 */
export interface SpreaderSetting {
  spreaderId: string
  /** As printed, so '3 1/4' stays '3 1/4' rather than becoming 3.25. */
  setting: string
  note?: string
}

export interface ProductBag {
  lb: number
  coverageSqFt: number
}

/**
 * A product you can actually buy, with the label numbers behind it.
 *
 * Liquids carry a broadcast dose per 1,000 sq ft (the only rate that scales to
 * a lawn) and, where the label prints one, a spot-spray mix per gallon.
 * Granulars carry pounds per 1,000 sq ft plus published spreader settings.
 */
export interface Product {
  id: string
  name: string
  brand: string
  form: ProductForm
  /** Active ingredients with percentages, as printed. */
  active: string
  /** The job in plain words, e.g. 'Broadleaf weeds in an established lawn'. */
  purpose: string
  /** Tasks this serves, so the list can follow what's due. */
  taskIds: string[]
  /** Concentrate per 1,000 sq ft, broadcast. */
  ozPer1000?: number
  ozPer1000Range?: [number, number]
  /** Dry concentrates (WDG, DF) are weighed, not poured. */
  measure?: LiquidMeasure
  /** Water the label wants behind that dose, gallons per 1,000 sq ft. */
  waterGalPer1000?: [number, number]
  /** Spot-spray mix, fl oz per gallon, only where the label prints one. */
  ozPerGallon?: number
  /** Surfactant or oil the label requires in the tank. */
  adjuvant?: string
  /** Pounds of product per 1,000 sq ft. */
  lbPer1000?: number
  lbPer1000Range?: [number, number]
  bags?: ProductBag[]
  settings?: SpreaderSetting[]
  /**
   * Spreaders the label forbids — not the same as a missing setting. Several
   * weed-and-feeds rule out hand-helds outright, and there the answer is a
   * different spreader rather than a calibration strip.
   */
  notLabeledFor?: string[]
  waterIn?: WaterIn
  /** Watering advice in the label's own terms, when the plain cases don't fit. */
  waterInNote?: string
  /** Re-entry or dry time in the label's own terms. */
  reentry?: string
  maxPerYear?: string
  /** Turf this is labeled for, so a warm-season-only product can warn a cool lawn. */
  turf?: GrassType[]
  /** Grass restrictions worth knowing before you buy. */
  grassNote?: string
  notes: string
  labelUrl?: string
}

export interface SprayerMixInput {
  mode?: MixMode
  tankGallons?: number
  ozPerGallon?: number
  ozPer1000?: number
  coverageSqFtPerTank?: number
  targetSqFt?: number
}

export interface SprayerMixResult {
  productOzPerTank: number
  waterGallonsPerTank: number
  tanksNeeded: number
  totalProductOz: number
  totalWaterGallons: number
}

export interface MetricBlock {
  mean: number | null
  bySite?: Record<string, number>
  year?: number
}

export interface CultivarMetrics {
  transitionQuality?: MetricBlock
  knoxvilleQuality?: MetricBlock
  geneticColor?: MetricBlock
  brownPatch?: MetricBlock
  droughtQuality?: MetricBlock
  nationalMeanQuality?: MetricBlock
  [key: string]: MetricBlock | undefined
}

export interface Cultivar {
  id: string
  name: string
  aliases?: string[]
  metrics?: CultivarMetrics
  /** Set by the ingest. Needed to link a mixture's off-species component. */
  species?: string
  trial?: string
}

export interface NtepMeta {
  species: string
  trial: string
  year: number
  sourcePdf: string
  notes: string
}

export interface CultivarPack {
  meta: NtepMeta
  count: number
  cultivars: Cultivar[]
}

export interface NtepSite {
  name: string
  state: string
  climateBand: string
  lat: number
  lon: number
}

export interface NearbySite extends NtepSite {
  code: string
  distanceKm: number
}

export interface SpeciesInfo {
  id: string
  label: string
  season: string
  ntepTrials?: string[]
  status?: string
}

export interface BlendComponent {
  name: string
  cultivarId?: string
  percent: number | null
}

export type BlendChannel = 'retail' | 'pro' | 'specialty' | 'amazon'
export type UrlCheckMode = 'strict' | 'lenient'
/** How you buy it. Some NTEP entries are patented hybrids with no seed at all. */
export type BlendForm = 'seed' | 'sod'

export interface Blend {
  id: string
  name: string
  manufacturer: string
  species: string
  curated: boolean
  profile?: string
  summary?: string
  components: BlendComponent[]
  notes?: string
  channel?: BlendChannel
  /** Defaults to seed when absent. */
  form?: BlendForm
  buyHint?: string
  /** Product page. Required on curated blends. */
  url?: string
  /** Company home page. Required on curated blends. */
  companyUrl?: string
  /** Climate bands this bag is meant for. Required on curated blends. */
  zones?: ClimateBandId[]
  /** Live URL checks: Amazon/CDN bots often 403 — those are lenient. */
  urlCheck?: UrlCheckMode
}

export type ScoreFactor = 'nearest' | 'region' | 'summerStress' | 'color' | 'national'

export interface ScorePart {
  key: ScoreFactor
  weight: number
  value: number
}

export interface Coverage {
  factors: number
  totalFactors: number
  missing: ScoreFactor[]
  weight: number
  complete: boolean
}

export interface CultivarFit {
  score: number | null
  label: string
  parts: ScorePart[]
  coverage: Coverage
  /** Site the nearest factor was read from — null when a mean stood in for it. */
  nearestSite: NearbySite | null
  climate: ClimateBand | null
}

export interface BlendComponentFit extends BlendComponent {
  cultivar: Cultivar | null
  fit: CultivarFit | null
}

export interface BlendFit {
  score: number | null
  label: string
  components: BlendComponentFit[]
  coverage: Coverage
  strengths: string[]
  watchouts: string[]
  averages?: {
    drought: number | null
    brownPatch: number | null
    color: number | null
  }
  /** Weighted mean of each score factor across the cultivars that report it. */
  factors?: Partial<Record<ScoreFactor, number>>
  /** Site behind the nearest factor, when every scored cultivar shares one. */
  nearestSite?: NearbySite | null
}

/** One labelled 1-9 rating bar on a blend card or detail page. */
export interface FitMeter {
  key: string
  label: string
  value: number
  hint: string
  /** Mean of this factor across the trial, drawn as a reference mark. */
  baseline?: number
}

export interface Profile {
  lawnName: string
  lawnSqFt: number
  grassType: GrassType | ''
  /** Species ids you actually grow, from the NTEP catalog; empty means no preference. */
  seedSpecies: string[]
  soilType: string
  sunExposure: string
  notes: string
}

export interface Equipment {
  tankGallons: number
  sprayCoverageSqFtPerTank: number
  /** Which spreader's setting column to read; '' until you pick one. */
  spreaderId: string
  /** Units for tank and dose figures — what you measure with, not what the label prints. */
  sprayUnits: SprayUnits
}

export interface RateOverride {
  per1000?: number
  depthInches?: number
  ozPerGallon?: number
  ozPer1000?: number
}

export interface RootState {
  profile: Profile
  location: UserLocation
  equipment: Equipment
  rateOverrides: Record<string, RateOverride>
  userBlends: Blend[]
}

export interface BackupPayload {
  version: number
  exportedAt: string
  profile: Profile
  location: UserLocation
  equipment: Equipment
  rateOverrides: Record<string, RateOverride>
  userBlends: Blend[]
}

export interface BarDatum {
  label: string
  value: number
  color?: string
}

export interface GroupedBarRow {
  label: string
  a: number
  b: number
}

export interface ChartOptions {
  rowHeight?: number
  leftMargin?: number
  min?: number
  max?: number
  digits?: number
  aName?: string
  bName?: string
  aColor?: string
  bColor?: string
}
