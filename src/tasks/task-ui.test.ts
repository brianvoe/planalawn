import { describe, expect, it } from 'vitest'
import { getTask, tasks } from '../data/tasks'
import { evaluateTask } from '../services/timing'
import {
  byUrgency,
  groupFor,
  iconFor,
  searchTextFor,
  soilGateFor,
  statusFor,
  taskGroups,
  taskIcons,
  toolFor,
  urgencyBands,
  windowFor,
  windowStatusFor,
} from './task-ui'
import type { Bucket, EvaluatedTask, Task } from '../types'

function task(id: string): Task {
  const found = getTask(id)
  if (!found) throw new Error(`no task ${id}`)
  return found
}

/** Overseeding gates on soil 55–65°F in Sep–Oct, so it can reach every bucket. */
function seeding(month: number, soilTempF?: number): EvaluatedTask {
  return evaluateTask(task('overseeding'), { month, soilTempF })
}

describe('groups', () => {
  it('claims every category in the catalog', () => {
    const claimed = new Set(taskGroups.flatMap((g) => g.categories))
    const orphans = [...new Set(tasks.map((t) => t.category))].filter((c) => !claimed.has(c))
    expect(orphans).toEqual([])
  })

  it('leaves no group empty', () => {
    taskGroups.forEach((group) => {
      expect(tasks.filter((t) => groupFor(t).id === group.id).length).toBeGreaterThan(0)
    })
  })
})

describe('icons', () => {
  it('has an entry per job and no entry for a job that is gone', () => {
    const ids = tasks.map((t) => t.id).sort()
    expect(Object.keys(taskIcons).sort()).toEqual(ids)
  })

  it('only names registered icon sets', () => {
    tasks.forEach((t) => {
      expect(['fas', 'lawn']).toContain(iconFor(t)[0])
    })
  })
})

describe('windowFor', () => {
  it('collapses consecutive months into a range', () => {
    expect(windowFor(task('lawn-kill'))).toBe('Aug–Sep')
    expect(windowFor(task('fertilization'))).toBe('Sep–Nov')
  })

  it('splits non-consecutive months and sorts them', () => {
    // Stored out of order as [9, 10, 3, 4].
    expect(windowFor(task('watering'))).toBe('Mar–Apr, Sep–Oct')
    expect(windowFor(task('post-em-broadleaf'))).toBe('Apr–May, Oct')
  })
})

describe('soilGateFor', () => {
  it('reads gates as a requirement, both-sided or open-ended', () => {
    expect(soilGateFor(task('overseeding'))).toBe('Soil 55–65°F')
    expect(soilGateFor(task('lawn-kill'))).toBe('Soil 55°F+')
    expect(soilGateFor(task('topsoil'))).toBe('')
  })
})

describe('toolFor', () => {
  it('names the tool from the calculator, and stays quiet without one', () => {
    expect(toolFor(task('post-em-grassy'))?.label).toBe('Sprayer')
    expect(toolFor(task('fertilization'))?.label).toBe('Spreader')
    expect(toolFor(task('mulch'))?.label).toBe('Bulk')
    expect(toolFor(task('aeration'))).toBeNull()
  })
})

describe('urgency bands', () => {
  it('names every bucket a task can land in', () => {
    const ids = urgencyBands.map((band) => band.id).sort()
    expect(ids).toEqual(['later', 'now', 'soon'] satisfies Bucket[])
  })

  it('only names registered icon sets', () => {
    urgencyBands.forEach((band) => {
      expect(['fas', 'lawn']).toContain(band.icon[0])
    })
  })
})

describe('statusFor', () => {
  it('badges the two bands worth interrupting for', () => {
    expect(statusFor(seeding(9, 60))).toEqual({ label: 'Do now', tone: 'good' })
    expect(statusFor(seeding(9, 90))).toEqual({ label: 'Coming up', tone: 'caution' })
  })

  it('stays quiet out of season, so the open work keeps the only chips', () => {
    expect(seeding(1).bucket).toBe('later')
    expect(statusFor(seeding(1))).toBeNull()
  })
})

describe('windowStatusFor', () => {
  it('reports the kind of window when today cannot be judged', () => {
    expect(windowStatusFor(seeding(9))).toEqual({ label: 'Primary window', tone: 'brand' })
    expect(windowStatusFor(seeding(3))).toEqual({ label: 'Also typical', tone: 'accent' })
  })
})

describe('byUrgency', () => {
  it('floats what today allows above what it does not', () => {
    const sorted = [seeding(1), seeding(9, 90), seeding(9, 60)]
      .sort(byUrgency)
      .map((item) => item.bucket)
    expect(sorted).toEqual(['now', 'soon', 'later'])
  })
})

describe('searchTextFor', () => {
  it('reaches the product on the shelf, not just the job name', () => {
    expect(searchTextFor(task('post-em-grassy'))).toContain('quinclorac')
    expect(searchTextFor(task('peat-moss'))).toContain('sphagnum')
  })
})
