/**
 * JSON-LD for the routes that have something concrete to declare.
 *
 * Built from the same task and blend records the pages render, so the markup
 * cannot drift from what a reader sees — which is the one rule that matters,
 * since structured data disagreeing with the visible page is worse than none.
 *
 * On what is worth emitting in 2026: BreadcrumbList is the only type here that
 * still draws anything in a Google result. HowTo rich results were withdrawn in
 * September 2023 and FAQ followed in May 2026, so neither buys a SERP feature
 * any more. HowTo stays on the task pages regardless — those pages really are
 * ordered procedures with tools and supplies, the markup is generated rather
 * than hand-kept, and answer engines still read it. Product is here to say what
 * a blend page is about, not to win a snippet: that needs a price, and this
 * site does not sell the bags.
 */

import { tasks } from '../data/tasks'
import { curatedBlendList } from '../data/blends/curated'
import { SITE_URL } from './paths'
import type { Blend, Task } from '../types'

const SITE_NAME = 'Plan a Lawn'
const ORG_ID = `${SITE_URL}/#organization`

type Node = Record<string, unknown>

const taskById = new Map(tasks.map(task => [task.id, task]))
const blendById = new Map(curatedBlendList.map(blend => [blend.id, blend]))

type Crumb = [name: string, path: string]

/** The trail up to a section, without the page itself. */
const TRAILS: Record<string, Crumb[]> = {
  calendar: [['Home', '/'], ['Calendar', '/calendar']],
  tasks: [['Home', '/'], ['Tasks', '/tasks']],
  seeds: [['Home', '/'], ['Seeds', '/seeds']],
  'seed-blends': [['Home', '/'], ['Seeds', '/seeds'], ['Blends', '/seeds/blends']],
  'seed-cultivars': [['Home', '/'], ['Seeds', '/seeds'], ['Cultivars', '/seeds/cultivars']],
  'seed-compare': [['Home', '/'], ['Seeds', '/seeds'], ['Compare', '/seeds/compare']],
  'seed-ntep': [['Home', '/'], ['Seeds', '/seeds'], ['NTEP tables', '/seeds/ntep']],
  calculate: [['Home', '/'], ['Calculate', '/calculate']],
}

function breadcrumb(trail: Crumb[]): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: `${SITE_URL}${path}`,
    })),
  }
}

function howTo(task: Task): Node {
  return {
    '@type': 'HowTo',
    name: task.name,
    description: task.summary,
    ...(task.equipment.length && {
      tool: task.equipment.map(name => ({ '@type': 'HowToTool', name })),
    }),
    ...(task.supplies.length && {
      supply: task.supplies.map(name => ({ '@type': 'HowToSupply', name })),
    }),
    step: task.steps.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text,
    })),
  }
}

function product(blend: Blend): Node {
  return {
    '@type': 'Product',
    name: blend.name,
    ...(blend.summary && { description: blend.summary }),
    brand: { '@type': 'Brand', name: blend.manufacturer },
    category: blend.form === 'sod' ? 'Sod' : 'Grass seed',
    url: `${SITE_URL}/seeds/blends/${blend.id}`,
  }
}

/**
 * Declared once on the home page and referenced by id elsewhere, which is what
 * @graph is for: the same organisation restated on sixty pages is sixty things
 * to reconcile.
 */
function siteNodes(): Node[] {
  return [
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      publisher: { '@id': ORG_ID },
    },
  ]
}

/**
 * Empty for anything carrying noindex, and for ids that resolve to nothing.
 * Describing a page in detail while asking for it to be ignored is a
 * contradiction, and there is nothing to describe on a blend someone typed in.
 */
export function schemaForRoute(name: string, params: Record<string, unknown>): Node[] {
  const id = typeof params.id === 'string' ? params.id : ''

  if (name === 'home') {
    return siteNodes()
  }

  if (name === 'task-detail') {
    const task = taskById.get(id)
    return task ? [howTo(task), breadcrumb([...TRAILS.tasks, [task.name, `/tasks/${task.id}`]])] : []
  }

  if (name === 'seed-blend') {
    const blend = blendById.get(id)
    return blend
      ? [
          product(blend),
          breadcrumb([...TRAILS['seed-blends'], [blend.name, `/seeds/blends/${blend.id}`]]),
        ]
      : []
  }

  const trail = TRAILS[name]
  return trail ? [breadcrumb(trail)] : []
}
