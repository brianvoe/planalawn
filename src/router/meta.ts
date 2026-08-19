/**
 * The title, description and canonical URL for every route.
 *
 * This lives in the router rather than in the page components for two reasons.
 * It keeps all the copy that shows up in search results and link previews in
 * one file, where it can be read as a set and kept from repeating itself. And
 * it means the tags are written during navigation, before the page has fetched
 * anything, which is what the build-time prerenderer captures.
 *
 * Titles are short on purpose: search results cut off around sixty characters,
 * and the site name on the end eats eleven of them.
 */

import { tasks } from '../data/tasks'
import { curatedBlendList } from '../data/blends/curated'

const SITE_NAME = 'Plan a Lawn'

export interface PageMeta {
  title: string
  description: string
  /** Kept out of the index: user data, or a URL we cannot describe. */
  noindex?: boolean
}

/**
 * Keyed by route name. Every named route needs an entry — the fallback exists
 * for unknown ids, not as somewhere to leave a route unwritten.
 */
const PAGES: Record<string, PageMeta> = {
  home: {
    title: 'Plan a Lawn — know what to do next',
    description:
      'Lawn timing from the live soil temperature at your address, product rates for your square footage, and grass seed scored on NTEP trial data.',
  },
  calendar: {
    title: `Lawn calendar · ${SITE_NAME}`,
    description:
      'Every lawn job mapped to the month and soil temperature it belongs in, for cool-season, warm-season and transition lawns.',
  },
  tasks: {
    title: `Lawn tasks and playbooks · ${SITE_NAME}`,
    description:
      'Playbooks for mowing, seeding, fertilising, pre-emergent and grub control — each with the timing, equipment and rate for your lawn.',
  },
  seeds: {
    title: `Grass seed scored on trial data · ${SITE_NAME}`,
    description:
      'Which bag is actually worth buying. Blends and cultivars scored against the NTEP trial plots nearest you, with the evidence shown.',
  },
  'seed-blends': {
    title: `Grass seed blends ranked · ${SITE_NAME}`,
    description:
      'Named seed blends scored on drought, disease and colour using NTEP trial results for the cultivars printed on the bag.',
  },
  'seed-cultivars': {
    title: `Grass cultivars on trial data · ${SITE_NAME}`,
    description:
      'Every named cultivar in the NTEP trials, scored for drought, brown patch, colour and density at the trial sites nearest you.',
  },
  'seed-compare': {
    title: `Compare seed blends · ${SITE_NAME}`,
    description:
      'Put two or three grass seed blends on the same charts and see which holds up on drought, disease and colour where you live.',
  },
  'seed-ntep': {
    title: `NTEP trial tables · ${SITE_NAME}`,
    description:
      'The National Turfgrass Evaluation Program tables behind every score on this site, browsable by species and trial site.',
  },
  calculate: {
    title: `Lawn rate calculator · ${SITE_NAME}`,
    description:
      'Turn label rates into tank ounces, pounds per thousand square feet and spreader settings for your lawn, for products by name.',
  },
  settings: {
    title: `My lawn · ${SITE_NAME}`,
    description: 'Your lawn size, location and equipment — saved in this browser only.',
    noindex: true,
  },
}

const FALLBACK = PAGES.home

const taskById = new Map(tasks.map(t => [t.id, t]))
const blendById = new Map(curatedBlendList.map(b => [b.id, b]))

/** Trimmed to something a search result will not cut mid-word. */
function clamp(text: string, limit = 158): string {
  if (text.length <= limit) {
    return text
  }
  return `${text.slice(0, text.lastIndexOf(' ', limit - 1))}…`
}

/**
 * A URL we cannot name — an unknown task, or one of the `user-` blends someone
 * built from a bag tag, which only exists in their browser. It still has to
 * render, but there is nothing worth indexing behind it.
 */
function unknown(page: PageMeta): PageMeta {
  return { ...page, noindex: true }
}

export function metaForRoute(name: string, params: Record<string, unknown>): PageMeta {
  const id = typeof params.id === 'string' ? params.id : ''

  if (name === 'task-detail') {
    const task = taskById.get(id)
    return task
      ? { title: `${task.name} · ${SITE_NAME}`, description: clamp(task.summary) }
      : unknown(PAGES.tasks)
  }

  if (name === 'seed-blend') {
    const blend = blendById.get(id)
    return blend
      ? {
          title: `${blend.name} · ${SITE_NAME}`,
          description: clamp(`${blend.name} from ${blend.manufacturer}. ${blend.summary}`),
        }
      : unknown(PAGES['seed-blends'])
  }

  return PAGES[name] ?? FALLBACK
}
