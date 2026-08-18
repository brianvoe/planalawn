import { tasks } from './tasks'

/**
 * What you are trying to do this season.
 *
 * The catalog holds every job the site knows, but several of them are choices
 * rather than steps: killing the lawn off only makes sense on a full reset, and
 * a fall pre-emergent is the one thing you must *not* do if seed is going down,
 * because the barrier that stops Poa stops fescue too. Listing all of it at
 * once is what makes a month read as a pile instead of a plan, so the plan
 * commits to one path and shows only the work that path actually involves.
 *
 * Baseline work — mowing, feeding, weeds, grubs, beds — is shared by every
 * path and is derived rather than repeated: anything no path claims is
 * everyone's.
 */
export type SeasonPathId = 'maintain' | 'overseed' | 'reset'

export interface SeasonPath {
  id: SeasonPathId
  label: string
  blurb: string
  icon: [string, string]
  /** Seeding-cluster jobs this path turns on. */
  adds: string[]
  /** Baseline jobs this path turns off, because they fight with the adds. */
  drops: string[]
}

export const seasonPaths: SeasonPath[] = [
  {
    id: 'maintain',
    label: 'Just maintaining',
    blurb: 'No seed going down. Keep what is there healthy and weed-free.',
    icon: ['lawn', 'grass'],
    adds: [],
    drops: [],
  },
  {
    id: 'overseed',
    label: 'Overseeding',
    blurb: 'Thickening the lawn you already have, without starting over.',
    icon: ['lawn', 'seed'],
    adds: ['aeration', 'topsoil', 'overseeding', 'peat-moss', 'watering'],
    // A typical fall pre-emergent blocks fescue seed for months, not weeks.
    drops: ['pre-em-fall'],
  },
  {
    id: 'reset',
    label: 'Full reset',
    blurb: 'Killing off what is there and establishing a new stand.',
    icon: ['lawn', 'seed-bag'],
    adds: ['lawn-kill', 'topsoil', 'aeration', 'seeding', 'peat-moss', 'watering'],
    // Selective weed control is wasted on turf you are about to spray off
    // entirely, and its pre-seed interval is longer than the kill's.
    drops: ['pre-em-fall', 'post-em-broadleaf', 'post-em-grassy'],
  },
]

export const defaultPathId: SeasonPathId = 'maintain'

export function getPath(id: string): SeasonPath {
  return seasonPaths.find((p) => p.id === id) || seasonPaths[0]
}

/** Jobs no path claims — the work every lawn does regardless of the plan. */
const claimed = new Set(seasonPaths.flatMap((p) => p.adds))
export const baselineTaskIds: string[] = tasks
  .map((t) => t.id)
  .filter((id) => !claimed.has(id))

/** The job list for a path, in catalog order. */
export function taskIdsForPath(id: string): string[] {
  const path = getPath(id)
  const drops = new Set(path.drops)
  const adds = new Set(path.adds)
  return tasks
    .map((t) => t.id)
    .filter((taskId) => {
      if (drops.has(taskId)) return false
      return adds.has(taskId) || baselineTaskIds.includes(taskId)
    })
}
