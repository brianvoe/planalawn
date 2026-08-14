export type StatusTone = 'good' | 'caution' | 'cold' | 'hot' | 'neutral'
export type Bucket = 'now' | 'soon' | 'later'
export type ClimateBandId = 'cool' | 'transition' | 'warm'
export type LocationSource = 'zip' | 'geocode' | 'geolocation' | 'metro'
export type MixMode = 'perGallon' | 'per1000'
export type CalculatorType = 'sprayer' | 'coverage' | 'volume'
export type ProjectPhase = 'maintenance' | 'renovation' | 'establishment'
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
}

export interface Profile {
  lawnName: string
  lawnSqFt: number
  grassType: GrassType | ''
  preferredSeed: string
  soilType: string
  sunExposure: string
  notes: string
}

export interface Equipment {
  tankGallons: number
  sprayCoverageSqFtPerTank: number
}

export interface RateOverride {
  per1000?: number
  depthInches?: number
  ozPerGallon?: number
  ozPer1000?: number
}

export interface Project {
  phase: ProjectPhase
  killAppliedAt: string | null
  secondKillAt: string | null
  aeratedAt: string | null
  topsoilAt: string | null
  seededAt: string | null
  firstMowAt: string | null
  notes: string
}

export interface RootState {
  profile: Profile
  location: UserLocation
  equipment: Equipment
  rateOverrides: Record<string, RateOverride>
  project: Project
  userBlends: Blend[]
}

export interface BackupPayload {
  version: number
  exportedAt: string
  profile: Profile
  location: UserLocation
  equipment: Equipment
  rateOverrides: Record<string, RateOverride>
  project: Project
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
