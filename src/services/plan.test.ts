import { describe, expect, it } from 'vitest'
import { buildMonthPlan, weekWindows } from './plan'
import { conflictBetween, sequenceFor } from '../data/sequencing'
import { baselineTaskIds, seasonPaths, taskIdsForPath } from '../data/seasonPaths'
import { tasks } from '../data/tasks'
import { timingByTask } from '../data/timingRules'
import type { MonthPlan } from './plan'

const SEPTEMBER = 9
const YEAR = 2026

function idsIn(plan: MonthPlan): string[] {
  return plan.weeks.flatMap((w) => w.items.map((i) => i.item.task.id))
}

function weekOf(plan: MonthPlan, taskId: string): number {
  return plan.weeks.findIndex((w) => w.items.some((i) => i.item.task.id === taskId))
}

describe('season paths', () => {
  it('gives every task a home in at least one path', () => {
    const covered = new Set(seasonPaths.flatMap((p) => taskIdsForPath(p.id)))
    tasks.forEach((task) => {
      expect(covered.has(task.id), `${task.id} appears in no path`).toBe(true)
    })
  })

  it('keeps fall pre-emergent out of both seeding paths', () => {
    expect(taskIdsForPath('maintain')).toContain('pre-em-fall')
    expect(taskIdsForPath('overseed')).not.toContain('pre-em-fall')
    expect(taskIdsForPath('reset')).not.toContain('pre-em-fall')
  })

  it('does not offer renovation work to someone only maintaining', () => {
    const maintain = taskIdsForPath('maintain')
    expect(maintain).not.toContain('lawn-kill')
    expect(maintain).not.toContain('seeding')
    expect(maintain).not.toContain('overseeding')
  })

  it('separates the two seeding paths', () => {
    expect(taskIdsForPath('overseed')).toContain('overseeding')
    expect(taskIdsForPath('overseed')).not.toContain('lawn-kill')
    expect(taskIdsForPath('reset')).toContain('seeding')
    expect(taskIdsForPath('reset')).not.toContain('overseeding')
  })

  it('shares the weekly upkeep work with everyone', () => {
    expect(baselineTaskIds).toContain('mowing')
    seasonPaths.forEach((path) => {
      expect(taskIdsForPath(path.id)).toContain('mowing')
    })
  })
})

describe('sequencing data', () => {
  it('only references tasks that exist', () => {
    const known = new Set(tasks.map((t) => t.id))
    tasks.forEach((task) => {
      const seq = sequenceFor(task.id)
      Object.keys(seq.after || {}).forEach((id) => expect(known.has(id)).toBe(true))
      ;(seq.conflicts || []).forEach((c) => expect(known.has(c.taskId)).toBe(true))
    })
  })

  it('reads a conflict from either side of the pair', () => {
    expect(conflictBetween('post-em-broadleaf', 'post-em-grassy')).not.toBeNull()
    expect(conflictBetween('post-em-grassy', 'post-em-broadleaf')).not.toBeNull()
    expect(conflictBetween('mulch', 'mowing')).toBeNull()
  })

  it('leaves the label-driven waits on the jobs that need them', () => {
    expect(sequenceFor('seeding').after?.['lawn-kill']).toBeGreaterThanOrEqual(14)
    expect(sequenceFor('seeding').after?.['post-em-broadleaf']).toBeGreaterThanOrEqual(28)
  })

  it('keeps a seed barrier and seed apart in both directions', () => {
    expect(sequenceFor('overseeding').after?.['pre-em-spring']).toBeGreaterThanOrEqual(56)
    expect(sequenceFor('pre-em-spring').after?.overseeding).toBeGreaterThanOrEqual(56)
  })
})

describe('weekWindows', () => {
  it('starts at today when you are standing in the month', () => {
    const weeks = weekWindows(YEAR, SEPTEMBER, new Date(YEAR, 8, 10))
    expect(weeks[0].start.getDate()).toBe(10)
  })

  it('starts at the 1st for a month you are only browsing', () => {
    const weeks = weekWindows(YEAR, SEPTEMBER, new Date(YEAR, 6, 10))
    expect(weeks[0].start.getDate()).toBe(1)
    expect(weeks).toHaveLength(5)
  })

  it('never runs past the end of the month', () => {
    const weeks = weekWindows(YEAR, SEPTEMBER, new Date(YEAR, 6, 1))
    expect(weeks[weeks.length - 1].end.getDate()).toBe(30)
  })

  it('labels a week as a date range', () => {
    const weeks = weekWindows(YEAR, SEPTEMBER, new Date(YEAR, 6, 1))
    expect(weeks[0].label).toBe('Sep 1–7')
  })
})

describe('buildMonthPlan', () => {
  const browsing = new Date(YEAR, 5, 1)

  it('respects the kill-to-seed interval', () => {
    const plan = buildMonthPlan({ year: YEAR, month: SEPTEMBER, pathId: 'reset', today: browsing })
    const kill = weekOf(plan, 'lawn-kill')
    const seed = weekOf(plan, 'seeding')
    expect(kill).toBeGreaterThanOrEqual(0)
    if (seed >= 0) {
      const gap = plan.weeks[seed].start.getTime() - plan.weeks[kill].start.getTime()
      expect(gap / (24 * 60 * 60 * 1000)).toBeGreaterThanOrEqual(14)
    } else {
      expect(plan.spillover.some((s) => s.item.task.id === 'seeding')).toBe(true)
    }
  })

  it('explains why a job waits', () => {
    const plan = buildMonthPlan({ year: YEAR, month: SEPTEMBER, pathId: 'reset', today: browsing })
    const seeded = [...plan.weeks.flatMap((w) => w.items), ...plan.spillover].find(
      (i) => i.item.task.id === 'seeding',
    )
    expect(seeded?.waitNote).toContain('Kill existing grass')
  })

  it('never asks for more than two separate trips in one week', () => {
    seasonPaths.forEach((path) => {
      for (let month = 1; month <= 12; month += 1) {
        const plan = buildMonthPlan({ year: YEAR, month, pathId: path.id, today: browsing })
        plan.weeks.forEach((week) => {
          const standalone = week.items.filter((i) => !i.sameVisitAs)
          expect(standalone.length).toBeLessThanOrEqual(2)
        })
      }
    })
  })

  it('keeps the seeding-day cluster on one visit', () => {
    const plan = buildMonthPlan({ year: YEAR, month: SEPTEMBER, pathId: 'overseed', today: browsing })
    const week = plan.weeks.find((w) => w.items.some((i) => i.item.task.id === 'overseeding'))
    const peat = week?.items.find((i) => i.item.task.id === 'peat-moss')
    expect(peat?.sameVisitAs).toBe('Overseeding')
  })

  it('will not schedule a crabgrass barrier onto a lawn it is seeding', () => {
    const plan = buildMonthPlan({ year: YEAR, month: 3, pathId: 'overseed', today: browsing })
    expect(idsIn(plan)).not.toContain('pre-em-spring')
    expect(plan.spillover.map((s) => s.item.task.id)).toContain('pre-em-spring')
  })

  it('says why it split a pair it could otherwise have doubled up', () => {
    const plan = buildMonthPlan({ year: YEAR, month: 5, pathId: 'maintain', today: browsing })
    expect(plan.separated.join(' ')).toContain('herbicide')
  })

  it('holds continuous work out of the weekly slots', () => {
    const plan = buildMonthPlan({ year: YEAR, month: SEPTEMBER, pathId: 'overseed', today: browsing })
    expect(plan.ongoing.map((o) => o.task.id)).toContain('mowing')
    expect(idsIn(plan)).not.toContain('mowing')
    expect(idsIn(plan)).not.toContain('watering')
  })

  it('schedules nothing that is out of season', () => {
    const plan = buildMonthPlan({ year: YEAR, month: 1, pathId: 'reset', today: browsing })
    expect(idsIn(plan)).toHaveLength(0)
  })

  it('only plans work the chosen path involves', () => {
    const plan = buildMonthPlan({ year: YEAR, month: SEPTEMBER, pathId: 'maintain', today: browsing })
    const scheduled = [...idsIn(plan), ...plan.spillover.map((s) => s.item.task.id)]
    expect(scheduled).not.toContain('seeding')
    expect(scheduled).not.toContain('lawn-kill')
  })

  it('places every eligible job somewhere it can be found', () => {
    seasonPaths.forEach((path) => {
      for (let month = 1; month <= 12; month += 1) {
        const plan = buildMonthPlan({ year: YEAR, month, pathId: path.id, today: browsing })
        const eligible = taskIdsForPath(path.id).filter((id) => {
          const rule = timingByTask[id]
          return rule && (rule.months.includes(month) || rule.secondaryMonths.includes(month))
        })
        const accounted = new Set([
          ...idsIn(plan),
          ...plan.spillover.map((s) => s.item.task.id),
          ...plan.ongoing.map((o) => o.task.id),
        ])
        eligible.forEach((id) => {
          expect(accounted.has(id), `${id} vanished from ${path.id} in month ${month}`).toBe(true)
        })
      }
    })
  })

  it('is deterministic', () => {
    const args = { year: YEAR, month: SEPTEMBER, pathId: 'reset', today: browsing } as const
    expect(idsIn(buildMonthPlan(args))).toEqual(idsIn(buildMonthPlan(args)))
  })
})
