import type { TimingRule } from '../types'

/**
 * Timing rules for cool-season (tall fescue) lawns in the transition zone.
 * These month windows are still a single national default — they are not yet
 * adjusted per climate band, so northern and southern users see the same
 * calendar. The soil-temperature gates are what actually localize a task.
 *
 * Soil temps are Fahrenheit at ~6 cm depth.
 * months are 1–12 inclusive windows (can wrap via primary/secondary).
 */

export const seedingSoilBand = {
  minF: 55,
  maxF: 65,
  idealMinF: 58,
  idealMaxF: 63,
  label: 'Fall seeding prefers soil ~55–65°F at 6 cm',
}

export const timingByTask: Record<string, TimingRule> = {
  'lawn-kill': {
    months: [8, 9],
    secondaryMonths: [3, 4],
    soilMinF: 55,
    soilMaxF: null,
    note: 'Best when weeds/turf are actively growing; allow wait time before seeding.',
  },
  aeration: {
    months: [9, 10],
    secondaryMonths: [3, 4],
    soilMinF: 50,
    soilMaxF: 70,
    note: 'Core aeration ahead of overseeding while soil is workable.',
  },
  overseeding: {
    months: [9, 10],
    secondaryMonths: [3, 4],
    soilMinF: seedingSoilBand.minF,
    soilMaxF: seedingSoilBand.maxF,
    note: 'Primary window is fall. Soil temperature matters more than the calendar date.',
  },
  seeding: {
    months: [9, 10],
    secondaryMonths: [3, 4],
    soilMinF: seedingSoilBand.minF,
    soilMaxF: seedingSoilBand.maxF,
    note: 'Full lawn reset seeding — same soil band as overseed; usually after kill + prep.',
  },
  topsoil: {
    months: [9, 10],
    secondaryMonths: [3, 4, 8],
    soilMinF: null,
    soilMaxF: null,
    note: 'Usually done during renovation prep, just before or with seeding.',
  },
  'peat-moss': {
    months: [9, 10],
    secondaryMonths: [3, 4],
    soilMinF: null,
    soilMaxF: null,
    note: 'Light topdress after seeding to improve seed-to-soil contact and moisture.',
  },
  mulch: {
    months: [3, 4, 5, 9, 10, 11],
    secondaryMonths: [],
    soilMinF: null,
    soilMaxF: null,
    note: 'Beds/trees — spring and fall are typical; avoid volcano mulching.',
  },
  fertilization: {
    months: [9, 10, 11],
    secondaryMonths: [3, 4],
    soilMinF: 50,
    soilMaxF: null,
    note: 'Starter with new seed; maintenance feed in cooler windows. Avoid heavy summer N.',
  },
  watering: {
    months: [9, 10, 3, 4],
    secondaryMonths: [5, 6, 7, 8],
    soilMinF: null,
    soilMaxF: null,
    note: 'Critical after seeding; summer watering is survival, not establishment.',
  },
  'pre-em-spring': {
    months: [3, 4],
    secondaryMonths: [2, 5],
    soilMinF: 50,
    soilMaxF: 58,
    note: 'Before crabgrass germinates. Soil ~50–55°F and rising is the usual cue — too warm and you missed it.',
  },
  'pre-em-fall': {
    months: [8, 9],
    secondaryMonths: [10],
    soilMinF: 55,
    soilMaxF: 75,
    note: 'Winter annuals / Poa. Skip this pass if you plan to seed this fall.',
  },
  'post-em-broadleaf': {
    months: [4, 5, 10],
    secondaryMonths: [3, 6, 9, 11],
    soilMinF: 50,
    soilMaxF: null,
    note: 'Weeds actively growing. Avoid drought-stressed turf and hot afternoons.',
  },
  'post-em-grassy': {
    months: [5, 6, 7],
    secondaryMonths: [8],
    soilMinF: 60,
    soilMaxF: null,
    note: 'Young crabgrass/foxtail is easier than mature clumps. Soil should be warm and weeds growing.',
  },
  'grub-preventative': {
    months: [4, 5, 6],
    secondaryMonths: [7],
    soilMinF: 50,
    soilMaxF: null,
    note: 'Before larvae are large. Exact month depends on the active (April vs early summer) — read the label.',
  },
  'grub-curative': {
    months: [8, 9],
    secondaryMonths: [7, 10],
    soilMinF: 55,
    soilMaxF: null,
    note: 'When you see scattered brown, spongy turf, or animals digging. Water the product in.',
  },
}

export const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const
