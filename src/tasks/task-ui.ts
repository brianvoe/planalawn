import { monthLabels, timingByTask } from '../data/timingRules'
import type { Bucket, EvaluatedTask, StatusTone, Task } from '../types'

/**
 * How the task library presents itself: what a job belongs with, what it looks
 * like, and the two or three facts that tell you what it is without opening it.
 *
 * The catalog in `data/tasks.ts` carries a `category` per job, which is the
 * right granularity for data but the wrong one for a page — seven headings for
 * sixteen jobs, three of them holding a single card. Groups fold those
 * categories into the handful of jobs people actually think in.
 */

export type IconRef = [string, string]

export interface TaskGroup {
  id: string
  label: string
  icon: IconRef
  blurb: string
  categories: string[]
}

/** Order is the order the page shows them in: the lawn's own season, roughly. */
export const taskGroups: TaskGroup[] = [
  {
    id: 'upkeep',
    label: 'Upkeep',
    icon: ['fas', 'scissors'],
    blurb: 'The weekly rhythm the one-off jobs fit around.',
    categories: ['maintenance'],
  },
  {
    id: 'seed',
    label: 'Seed & renovate',
    icon: ['lawn', 'seed'],
    blurb: 'Kill, prep, aerate, seed, and water it in.',
    categories: ['renovation', 'prep', 'establishment'],
  },
  {
    id: 'weeds',
    label: 'Weeds',
    icon: ['fas', 'spray-can'],
    blurb: 'Barriers before they sprout, rescues after.',
    categories: ['weeds'],
  },
  {
    id: 'feed',
    label: 'Feed',
    icon: ['lawn', 'granules'],
    blurb: 'Starter with seed, maintenance in the cool months.',
    categories: ['nutrition'],
  },
  {
    id: 'pests',
    label: 'Pests',
    icon: ['fas', 'bug'],
    blurb: 'Grubs: prevent early, treat damage late.',
    categories: ['pests'],
  },
  {
    id: 'beds',
    label: 'Beds & trees',
    icon: ['fas', 'tree'],
    blurb: 'Landscape work that is not lawn.',
    categories: ['landscape'],
  },
]

const groupByCategory: Record<string, TaskGroup> = {}
taskGroups.forEach((group) => {
  group.categories.forEach((category) => {
    groupByCategory[category] = group
  })
})

/** Falls back to the first group so an uncategorised job still lands somewhere. */
export function groupFor(task: Task): TaskGroup {
  return groupByCategory[task.category] || taskGroups[0]
}

/** Chip colours available to a task badge. Brand and accent carry no urgency. */
export type ChipTone = StatusTone | 'brand' | 'accent'

export interface TaskStatus {
  label: string
  tone: ChipTone
}

export interface UrgencyBand {
  id: Bucket
  label: string
  icon: IconRef
  blurb: string
}

/**
 * Urgency is the running order of both the task library and the calendar: the
 * question every visitor arrives with is "what do I do today", so the jobs that
 * answer it sort above the ones that don't.
 */
export const urgencyBands: UrgencyBand[] = [
  {
    id: 'now',
    label: 'Do now',
    icon: ['fas', 'check'],
    blurb: 'In season and the soil agrees — this is the work in front of you.',
  },
  {
    id: 'soon',
    label: 'Coming up',
    icon: ['fas', 'clock'],
    blurb: 'Close, but still waiting on the calendar or on soil temperature.',
  },
  {
    id: 'later',
    label: 'Later in the year',
    icon: ['fas', 'calendar-day'],
    blurb: 'Out of season. Here so you know it exists and when it comes back.',
  },
]

/**
 * Only the two bands worth interrupting for get a badge. "Later" is the resting
 * state of most of these jobs, and a row of grey "Later" chips would bury the
 * two that are actually open — the month range in the meta line already says
 * when to come back.
 */
const statusByBucket: Partial<Record<Bucket, TaskStatus>> = {
  now: { label: 'Do now', tone: 'good' },
  soon: { label: 'Coming up', tone: 'caution' },
}

export function statusFor(item: EvaluatedTask): TaskStatus | null {
  return statusByBucket[item.bucket] || null
}

/**
 * The badge for a month you are only browsing. Urgency needs today's soil to
 * mean anything, so a future month reports which kind of window it is instead
 * of pretending to know whether you can go out and do it.
 */
export function windowStatusFor(item: EvaluatedTask): TaskStatus {
  return item.primary
    ? { label: 'Primary window', tone: 'brand' }
    : { label: 'Also typical', tone: 'accent' }
}

const bucketOrder: Record<Bucket, number> = { now: 0, soon: 1, later: 2 }

/** Sorts the openable work to the top while holding catalog order inside a band. */
export function byUrgency(a: EvaluatedTask, b: EvaluatedTask): number {
  return bucketOrder[a.bucket] - bucketOrder[b.bucket]
}

/**
 * One icon per job. These are read at 18px in a tile, so each one has to be a
 * silhouette of the thing itself — the shield for a barrier laid before
 * germination, the leaf for broadleaf weeds, dots for aeration holes.
 */
export const taskIcons: Record<string, IconRef> = {
  mowing: ['fas', 'scissors'],
  'lawn-kill': ['fas', 'spray-can'],
  aeration: ['fas', 'grip'],
  overseeding: ['lawn', 'seed'],
  seeding: ['lawn', 'seed-bag'],
  topsoil: ['fas', 'trowel'],
  'peat-moss': ['fas', 'layer-group'],
  mulch: ['fas', 'tree'],
  fertilization: ['lawn', 'granules'],
  watering: ['fas', 'shower'],
  'pre-em-spring': ['fas', 'shield-halved'],
  'pre-em-fall': ['fas', 'snowflake'],
  'post-em-broadleaf': ['fas', 'leaf'],
  'post-em-grassy': ['lawn', 'grass'],
  'grub-preventative': ['fas', 'shield-halved'],
  'grub-curative': ['fas', 'bug-slash'],
}

export function iconFor(task: Task): IconRef {
  return taskIcons[task.id] || groupFor(task).icon
}

export interface TaskTool {
  label: string
  icon: IconRef
}

/**
 * What you'll be holding. The calculator type already encodes it — a job that
 * works out ounces per tank is a sprayer job — so jobs with no calculator
 * (aeration, watering) get no badge rather than an invented one.
 */
export function toolFor(task: Task): TaskTool | null {
  switch (task.calculator?.type) {
    case 'sprayer':
      return { label: 'Sprayer', icon: ['fas', 'spray-can'] }
    case 'coverage':
      return { label: 'Spreader', icon: ['lawn', 'granules'] }
    case 'volume':
      return { label: 'Bulk', icon: ['fas', 'trowel'] }
    default:
      return null
  }
}

/** Consecutive months collapse into ranges: [3,4,9,10] reads "Mar–Apr, Sep–Oct". */
function monthRanges(months: number[]): string[] {
  const sorted = [...new Set(months)].sort((a, b) => a - b)
  const out: string[] = []
  let start = 0
  sorted.forEach((month, i) => {
    const breaks = i === sorted.length - 1 || sorted[i + 1] !== month + 1
    if (!breaks) return
    const first = monthLabels[sorted[start] - 1]
    const last = monthLabels[month - 1]
    out.push(first === last ? first : `${first}–${last}`)
    start = i + 1
  })
  return out
}

/** The primary window only — secondary months are a detail-page nuance. */
export function windowFor(task: Task): string {
  const months = timingByTask[task.id]?.months || []
  if (!months.length) return 'Any time'
  return monthRanges(months).join(', ')
}

/** The soil gate as a requirement, independent of today's reading. */
export function soilGateFor(task: Task): string {
  const rule = timingByTask[task.id]
  if (!rule) return ''
  const { soilMinF: min, soilMaxF: max } = rule
  if (min != null && max != null) return `Soil ${min}–${max}°F`
  if (min != null) return `Soil ${min}°F+`
  if (max != null) return `Soil under ${max}°F`
  return ''
}

/**
 * Everything a search should reach. Materials are in here on purpose: people
 * search for the jug they already own ("quinclorac", "peat") more often than
 * for the name we gave the job.
 */
export function searchTextFor(task: Task): string {
  return [
    task.name,
    task.summary,
    task.why,
    groupFor(task).label,
    ...task.equipment,
    ...task.supplies,
  ]
    .join(' ')
    .toLowerCase()
}
