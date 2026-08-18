import { describe, expect, it } from 'vitest'
import { getTask, tasks } from '../data/tasks'
import {
  groupFor,
  iconFor,
  searchTextFor,
  soilGateFor,
  taskGroups,
  taskIcons,
  toolFor,
  windowFor,
} from './task-ui'
import type { Task } from '../types'

function task(id: string): Task {
  const found = getTask(id)
  if (!found) throw new Error(`no task ${id}`)
  return found
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

describe('searchTextFor', () => {
  it('reaches the product on the shelf, not just the job name', () => {
    expect(searchTextFor(task('post-em-grassy'))).toContain('quinclorac')
    expect(searchTextFor(task('peat-moss'))).toContain('sphagnum')
  })
})
