/** Cultivar ids that appear on published tags but are missing from the current NTEP extract. */
export const KNOWN_CULTIVAR_GAPS = ['4th-millennium-srp'] as const

export const KNOWN_CULTIVAR_GAP_SET = new Set<string>(KNOWN_CULTIVAR_GAPS)
