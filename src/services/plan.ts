import { getTask } from '../data/tasks'
import { conflictBetween, sequenceFor } from '../data/sequencing'
import { taskIdsForPath } from '../data/seasonPaths'
import { monthLabels } from '../data/timingRules'
import { evaluateTask } from './timing'
import type { EvaluatedTask } from '../types'

/**
 * Turns a month's worth of eligible jobs into a week-by-week running order.
 *
 * A month view that lists everything at once is not a plan — it tells you that
 * killing the lawn and seeding it are both "September" without mentioning that
 * doing them nine days apart wastes the seed. This spreads the work across real
 * weeks, honouring the intervals in `data/sequencing.ts` and capping how much
 * lands in any one weekend.
 *
 * The scheduler is deliberately greedy and single-pass rather than an optimiser.
 * Jobs are placed in sequence order, each into the first week that will take it,
 * which produces the same plan every time and one a person can argue with.
 */

/** Two real jobs is a full weekend for most people; the rest can wait a week. */
const MAX_PER_WEEK = 2

export interface PlanItem {
  item: EvaluatedTask
  /** Why this sits where it does, when something other than order put it there. */
  waitNote: string
  /**
   * The job this one rides along with. A zero-day interval is not "the same
   * week", it is the same trip across the lawn — seed goes into open aeration
   * holes and peat goes over the seed before either has time to dry out.
   */
  sameVisitAs: string
}

export interface PlanWeek {
  index: number
  start: Date
  end: Date
  label: string
  items: PlanItem[]
}

export interface MonthPlan {
  weeks: PlanWeek[]
  /** Continuous work — a band across the month rather than one week's job. */
  ongoing: EvaluatedTask[]
  /** In season, but the month runs out before they fit. */
  spillover: PlanItem[]
  /** Pairs the plan kept apart, worth surfacing so the split looks deliberate. */
  separated: string[]
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function formatDay(date: Date): string {
  return `${monthLabels[date.getMonth()]} ${date.getDate()}`
}

/**
 * Weeks run from the day you are actually standing on, not from the 1st. Being
 * told to do something in "week 1" when week 1 ended last Tuesday is worse than
 * no plan at all. Browsing a month you are not in starts at the 1st instead.
 */
export function weekWindows(year: number, month: number, today: Date): PlanWeek[] {
  const first = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const isCurrent = today.getFullYear() === year && today.getMonth() === month - 1
  let cursor = isCurrent ? startOfDay(today) : first

  const weeks: PlanWeek[] = []
  while (cursor <= lastDay) {
    const end = addDays(cursor, 6)
    const clamped = end > lastDay ? lastDay : end
    weeks.push({
      index: weeks.length,
      start: cursor,
      end: clamped,
      label:
        cursor.getTime() === clamped.getTime()
          ? formatDay(cursor)
          : `${formatDay(cursor)}–${clamped.getDate()}`,
      items: [],
    })
    cursor = addDays(cursor, 7)
  }
  return weeks
}

/** Days between two week starts, used to test an interval against a placement. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS)
}

export interface BuildPlanOptions {
  year: number
  month: number
  pathId: string
  today?: Date
  soilTempF?: number | null
}

export function buildMonthPlan({
  year,
  month,
  pathId,
  today = new Date(),
  soilTempF,
}: BuildPlanOptions): MonthPlan {
  const weeks = weekWindows(year, month, today)
  const separated = new Set<string>()

  const eligible = taskIdsForPath(pathId)
    .map((id) => getTask(id))
    .filter((task): task is NonNullable<typeof task> => Boolean(task))
    .map((task) => evaluateTask(task, { month, soilTempF }))
    // Out-of-season work is not part of this month's plan at all.
    .filter((item) => item.primary || item.secondary)

  const ongoing = eligible.filter((item) => sequenceFor(item.task.id).ongoing)
  const schedulable = eligible
    .filter((item) => !sequenceFor(item.task.id).ongoing)
    .sort((a, b) => sequenceFor(a.task.id).order - sequenceFor(b.task.id).order)

  const placedAt = new Map<string, Date>()
  const spillover: PlanItem[] = []

  schedulable.forEach((item) => {
    const seq = sequenceFor(item.task.id)
    const after = Object.entries(seq.after || {})

    // Earliest start the hard intervals allow, given what is already placed.
    let earliest = weeks.length ? weeks[0].start : startOfDay(today)
    let blocker = ''
    after.forEach(([depId, days]) => {
      const depStart = placedAt.get(depId)
      if (!depStart) return
      const ready = addDays(depStart, days)
      if (ready > earliest) {
        earliest = ready
        blocker = days > 0 ? `${days} days after ${getTask(depId)?.name || depId}` : ''
      }
    })

    // Companions ride along with whatever they attach to, so a full week does
    // not push topdressing a week away from the seed it is meant to cover.
    const companions = after.filter(([depId, days]) => days === 0 && placedAt.has(depId))

    let sameVisitAs = ''
    const target = weeks.find((week) => {
      if (daysBetween(week.start, earliest) > 0) return false

      // Tested before capacity so the reason is recorded whenever the pairing
      // is what kept them apart, not only when there was room to spare.
      const clash = week.items
        .map((placed) => conflictBetween(item.task.id, placed.item.task.id))
        .find(Boolean)
      if (clash) {
        separated.add(clash.reason)
        return false
      }

      const ridesAlong = companions.find(([depId]) =>
        week.items.some((placed) => placed.item.task.id === depId),
      )
      if (!ridesAlong && week.items.length >= MAX_PER_WEEK) return false
      sameVisitAs = ridesAlong ? getTask(ridesAlong[0])?.name || '' : ''
      return true
    })

    if (target) {
      target.items.push({ item, waitNote: blocker, sameVisitAs })
      placedAt.set(item.task.id, target.start)
    } else {
      spillover.push({ item, waitNote: blocker, sameVisitAs: '' })
    }
  })

  weeks.forEach((week) => {
    week.items.sort((a, b) => sequenceFor(a.item.task.id).order - sequenceFor(b.item.task.id).order)
  })

  return { weeks, ongoing, spillover, separated: [...separated] }
}
