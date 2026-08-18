/**
 * How the jobs in a month space out against each other.
 *
 * The catalog already knows which jobs follow which, but only as unordered
 * links — the actual intervals were buried in prose ("Wait 7–14+ days (label +
 * visible die-back) before tilling/seeding"). A week-by-week plan needs those
 * as numbers, so they live here.
 *
 * Three different things shape a month, and they are modelled separately:
 *
 * - `after` is a hard interval. Seed sown eleven days after a glyphosate pass
 *   fails, and no amount of free time in the calendar changes that. A zero here
 *   means the opposite: same visit, not merely same week.
 * - `conflicts` is a same-week exclusion. Nothing breaks if they slip, but the
 *   pairing is either wasteful or impossible to diagnose afterwards.
 * - `order` decides who claims a slot first, so the job that defines the season
 *   anchors the month and the opportunistic work fits around it.
 *
 * Intervals are conservative ends of the usual label ranges. The product in
 * your shed still outranks them, which is why every task keeps its caveats.
 */
export interface TaskConflict {
  taskId: string
  reason: string
}

export interface TaskSequence {
  /** Who claims a week first. Lower goes first. */
  order: number
  /** Days that must pass after another job before this one can start. */
  after?: Record<string, number>
  /** Jobs that should not share a week, and why. */
  conflicts?: TaskConflict[]
  /** Continuous work — a band across the month, not a slot in one week. */
  ongoing?: boolean
  /** What one pass actually costs you. */
  effort?: string
}

/** Label + visible die-back before a seedbed is worth preparing. */
const AFTER_KILL = 14
/** Selective herbicide either side of seed: roughly two to three mowings. */
const SEED_AND_BROADLEAF = 28
/** A crabgrass barrier does not care that your seed is the good kind. */
const PRE_EM_BLOCKS_SEED = 56

const HERBICIDE_STACK =
  'Two herbicide passes in one week — space them so you can tell which one worked.'
const GRUB_EITHER_OR =
  'Preventative and curative are different chemistries for different moments — pick the one that matches what you can see.'

export const sequenceByTask: Record<string, TaskSequence> = {
  mowing: {
    order: 0,
    ongoing: true,
    effort: 'Weekly',
  },

  // The season-defining work claims its weeks first.
  'lawn-kill': {
    order: 10,
    effort: 'An afternoon',
  },
  topsoil: {
    order: 20,
    after: { 'lawn-kill': AFTER_KILL },
    effort: 'A weekend',
  },
  aeration: {
    order: 25,
    after: { 'lawn-kill': AFTER_KILL },
    effort: 'An afternoon',
  },
  seeding: {
    order: 30,
    after: {
      'lawn-kill': AFTER_KILL,
      'pre-em-spring': PRE_EM_BLOCKS_SEED,
      'pre-em-fall': PRE_EM_BLOCKS_SEED,
      'post-em-broadleaf': SEED_AND_BROADLEAF,
      topsoil: 0,
      aeration: 0,
    },
    effort: 'A weekend',
  },
  overseeding: {
    order: 30,
    after: {
      'pre-em-spring': PRE_EM_BLOCKS_SEED,
      'pre-em-fall': PRE_EM_BLOCKS_SEED,
      'post-em-broadleaf': SEED_AND_BROADLEAF,
      aeration: 0,
    },
    effort: 'An afternoon',
  },
  'peat-moss': {
    order: 35,
    after: { seeding: 0, overseeding: 0 },
    effort: 'An afternoon',
  },
  fertilization: {
    order: 40,
    after: { seeding: 0, overseeding: 0 },
    effort: 'An hour',
  },
  watering: {
    order: 45,
    after: { seeding: 0, overseeding: 0 },
    ongoing: true,
    effort: 'Daily, in short cycles',
  },

  // Weed and pest work fits around the season, and waits on new seed.
  'pre-em-spring': {
    order: 50,
    after: { seeding: PRE_EM_BLOCKS_SEED, overseeding: PRE_EM_BLOCKS_SEED },
    effort: 'An afternoon',
  },
  'pre-em-fall': {
    order: 50,
    effort: 'An afternoon',
  },
  'post-em-broadleaf': {
    order: 55,
    after: { seeding: SEED_AND_BROADLEAF, overseeding: SEED_AND_BROADLEAF },
    conflicts: [{ taskId: 'post-em-grassy', reason: HERBICIDE_STACK }],
    effort: 'An afternoon',
  },
  'post-em-grassy': {
    order: 56,
    after: { seeding: SEED_AND_BROADLEAF, overseeding: SEED_AND_BROADLEAF },
    effort: 'An afternoon',
  },
  'grub-preventative': {
    order: 60,
    conflicts: [{ taskId: 'grub-curative', reason: GRUB_EITHER_OR }],
    effort: 'An hour, plus watering in',
  },
  'grub-curative': {
    order: 61,
    effort: 'An hour, plus watering in',
  },
  mulch: {
    order: 80,
    effort: 'A weekend',
  },
}

const fallback: TaskSequence = { order: 50 }

export function sequenceFor(taskId: string): TaskSequence {
  return sequenceByTask[taskId] || fallback
}

/**
 * Conflicts are declared once but bite both ways — grub curative has no opinion
 * about the preventative in its own entry, yet the pair is just as wrong in
 * that order.
 */
export function conflictBetween(a: string, b: string): TaskConflict | null {
  const forward = sequenceFor(a).conflicts?.find((c) => c.taskId === b)
  if (forward) return forward
  const back = sequenceFor(b).conflicts?.find((c) => c.taskId === a)
  return back ? { taskId: b, reason: back.reason } : null
}
