import curated from './curated.json'
import type { Blend } from '../../types'

/**
 * The bag catalog, on its own so it can be imported without the trial data.
 *
 * This used to be reached through seedDb, which meant anything wanting the list
 * of bags — the store, for one, and the store loads on every page — also pulled
 * in every NTEP cultivar pack behind it. That was most of the entry bundle.
 * Scoring still lives in seedDb; this is only the names.
 */
export const curatedBlendList = curated as Blend[]
