import { getTask } from '../data/tasks'
import type { IconRef } from '../tasks/task-ui'
import type { Product } from '../types'

/**
 * What a product looks like on a page that has no photograph of it.
 *
 * Amazon only licenses their product images to be served live from their own
 * API, access to which opens at a sales threshold this site has not reached,
 * and self-hosting a copy is not permitted. So there is no photograph to show
 * today, and an empty frame reads as a broken one.
 *
 * A drawn tile instead: the silhouette of the thing you actually pick up,
 * washed in the colour its job carries elsewhere on the site, with the bag
 * analysis printed on it where a bag has one. It fills the same square a photo
 * will, so a licensed image later is a change of source rather than of layout.
 */
export interface ProductTile {
  icon: IconRef
  /** N-P-K off the bag, e.g. '38-0-4'. Empty for anything not sold by analysis. */
  analysis: string
  /** Which job colour to wash the tile in; `default` for jobs without one. */
  tone: string
}

/** The categories with a colour of their own. Anything else falls back to green. */
const CATEGORY_TONES: Record<string, string> = {
  nutrition: 'feed',
  weeds: 'weeds',
  pests: 'pests',
}

/**
 * The analysis a bag leads with, e.g. the 30-0-4 of '30-0-4 with pendimethalin'.
 *
 * Read off `active` rather than the name because that is where every bag
 * states it, whether or not the name repeats it. Anchored to the start so a
 * percentage further along the line can never be mistaken for one; a sprayed
 * herbicide has no analysis and gets nothing.
 *
 * Worth surfacing because fertilizer entries are keyed to these numbers
 * precisely — makers reformulate under an unchanged name, and Turf Builder is
 * in the catalog twice, as 32-0-4 and 38-0-4. The analysis is what tells two
 * otherwise identical Scotts bags apart at a glance.
 */
function analysisOf(product: Product): string {
  return product.active.match(/^(\d{1,2}-\d{1,2}-\d{1,2})\b/)?.[1] || ''
}

/**
 * The name with the analysis taken off, once the tile is showing it.
 *
 * Only the numbers the tile actually prints, and only where what's left still
 * names the product: a trailing `6-4-0` goes and so does a bare `(38-0-4)`,
 * but `(32-0-4, older bag)` stays whole — the words beside the numbers are the
 * only thing separating that entry from the bag that replaced it.
 */
export function productDisplayName(product: Product): string {
  const analysis = analysisOf(product)
  if (!analysis) return product.name
  return product.name.replace(new RegExp(`\\s*\\(${analysis}\\)$|\\s+${analysis}$`), '')
}

/**
 * `inTaskId` is the job the reader is looking at, where there is one.
 *
 * It decides the tint, because a product serves several jobs and the first one
 * it lists is an artefact of how the entry was written rather than a ranking.
 * Turf Builder Halts is filed under spring pre-emergent ahead of feeding, so
 * keying off that alone puts one weed-coloured tile in a column of six feeding
 * ones on the fertilization page. Away from a task — the calculator — the
 * product's own first job is all there is to go on.
 */
export function productTile(product: Product, inTaskId?: string): ProductTile {
  const ids = inTaskId && product.taskIds.includes(inTaskId) ? [inTaskId] : product.taskIds
  const category = ids.map((id) => getTask(id)?.category).find(Boolean) || ''

  return {
    icon: product.form === 'granular' ? ['lawn', 'seed-bag'] : ['fas', 'spray-can'],
    analysis: analysisOf(product),
    tone: CATEGORY_TONES[category] || 'default',
  }
}
