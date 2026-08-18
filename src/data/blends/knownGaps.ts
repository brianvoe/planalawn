/**
 * Cultivar ids that appear on published tags but are missing from the current NTEP extract.
 *
 * Two reasons a tag name lands here: the cultivar sat out the trial cycle we ingested, or it
 * belongs to a species whose trial we have not ingested yet. Either way it scores as uncovered
 * rather than disqualifying the bag. Components are resolved across every ingested species, so
 * ingesting a new trial retires entries from this list — catalog.test.ts fails on stale ones.
 */
export const KNOWN_CULTIVAR_GAPS = [
  '4th-millennium-srp',
  'honeymoon',
  'rendition-rx',
  'saltillo',
  'summer',
  'wichita',
] as const

export const KNOWN_CULTIVAR_GAP_SET = new Set<string>(KNOWN_CULTIVAR_GAPS)
