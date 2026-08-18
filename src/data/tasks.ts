import type { Task } from '../types'

/**
 * Every job the site knows about.
 *
 * `equipment` and `supplies` are kept apart on purpose. They answer two
 * different questions on the morning of a job — what do I need to own or rent,
 * and what do I need to go and buy — and a single mixed list of "materials"
 * answered neither without reading it twice.
 */
export const tasks: Task[] = [
  {
    id: 'mowing',
    name: 'Mowing',
    category: 'maintenance',
    summary:
      'The weekly cut everything else schedules around. Never take more than a third of the blade.',
    why: 'Height and frequency do more for density and weed pressure than any bag you can buy.',
    prerequisites: [],
    nextTasks: [],
    steps: [
      'Set tall fescue at 3–4 inches — taller shades out weeds and holds moisture.',
      'Cut often enough that you remove no more than a third of the blade in one pass.',
      'Keep the blade sharp; a torn tip browns and invites disease.',
      'Return clippings unless the lawn is diseased or the row is thick enough to mat.',
      'On new seed, wait until seedlings reach mowing height and the ground is firm.',
    ],
    equipment: ['Mower', 'String trimmer for edges'],
    supplies: ['Spare or sharpened blade'],
    calculator: null,
    caveats: [
      'Scalping a stressed summer lawn undoes months of work — raise the deck in heat.',
      'New seedlings need 2–3 mowings before most herbicides are safe.',
    ],
  },
  {
    id: 'lawn-kill',
    name: 'Kill existing grass / weeds',
    category: 'renovation',
    summary:
      'Non-selective herbicide pass before a full lawn reset. Wait for die-back before seeding.',
    why: 'Removes competition so new tall fescue can establish cleanly.',
    prerequisites: [],
    nextTasks: ['topsoil', 'aeration', 'seeding'],
    steps: [
      'Mow short a few days before spraying if canopy is thick.',
      'Apply non-selective herbicide on a calm day when turf/weeds are actively growing.',
      'Keep pets/people off until dry per label.',
      'Wait 7–14+ days (label + visible die-back) before tilling/seeding.',
      'Plan a second pass on survivors if needed before seed.',
    ],
    equipment: ['Pump sprayer', 'PPE — gloves, eye protection, long sleeves'],
    supplies: ['Non-selective herbicide (glyphosate-type)'],
    calculator: { type: 'sprayer', rateKey: 'glyphosate' },
    caveats: [
      'Rates and wait intervals are product-specific — follow the label you buy.',
      'Avoid drift onto beds and desirable plants.',
    ],
  },
  {
    id: 'aeration',
    name: 'Core aeration',
    category: 'establishment',
    summary:
      'Pull cores to reduce compaction and open the soil for seed and water.',
    why: 'Improves seed-to-soil contact and rooting — especially valuable before overseed.',
    prerequisites: [],
    nextTasks: ['overseeding', 'seeding', 'fertilization'],
    steps: [
      'Water lightly the day before if soil is brick-hard.',
      'Core aerate when soil is moist but not muddy.',
      'Leave cores to break down (or lightly break up).',
      'Overseed and fertilize the same day when possible.',
    ],
    equipment: ['Core aerator (rental or service)', 'Flags to mark irrigation heads'],
    supplies: [],
    calculator: null,
    caveats: ['Skip if soil is saturated or frozen.', 'Solid-tine “aeration” is not a substitute for cores.'],
  },
  {
    id: 'overseeding',
    name: 'Overseeding',
    category: 'establishment',
    summary:
      'Thicken an existing tall fescue lawn. Best in fall when soil temps settle into the seeding band.',
    why: 'Maintains density so summer stress and weeds have less room.',
    prerequisites: ['aeration'],
    nextTasks: ['peat-moss', 'fertilization', 'watering'],
    steps: [
      'Confirm soil temperature is in the seeding band (see live conditions).',
      'Aerating first dramatically improves results.',
      'Spread seed evenly at overseed rate.',
      'Light peat or compost topdress for contact.',
      'Keep seedbed consistently moist until established.',
    ],
    equipment: ['Broadcast spreader'],
    supplies: [
      'Tall fescue blend (Calypsow or Resilience II)',
      'Peat or compost topdress (optional)',
    ],
    calculator: { type: 'coverage', rateKey: 'seedOverseed' },
    caveats: [
      'Soil temperature beats calendar date for germination success.',
      'Spring overseed is secondary — summer heat arrives faster.',
    ],
  },
  {
    id: 'seeding',
    name: 'Full lawn seeding (reset)',
    category: 'renovation',
    summary:
      'Bare-ground or full renovation seeding after kill and prep.',
    why: 'Establishes a new stand when the old lawn is too thin, weedy, or mismatched.',
    prerequisites: ['lawn-kill'],
    nextTasks: ['peat-moss', 'fertilization', 'watering'],
    steps: [
      'Complete kill + wait interval.',
      'Grade, add topsoil where needed, firm the seedbed.',
      'Seed at new-lawn rate when soil temp is in band.',
      'Starter fertilizer per bag directions.',
      'Light topdress; begin frequent light watering.',
    ],
    equipment: ['Broadcast spreader', 'Rake and lawn roller'],
    supplies: ['Tall fescue blend', 'Starter fertilizer', 'Topsoil as needed'],
    calculator: { type: 'coverage', rateKey: 'seedNew' },
    caveats: [
      'Do not seed into hot soil just because the calendar says September.',
      'See Seeds section for Calypsow vs Resilience II trial context.',
    ],
  },
  {
    id: 'topsoil',
    name: 'Topsoil / leveling',
    category: 'prep',
    summary: 'Add or spread soil to fix low spots and improve the seedbed.',
    why: 'Uneven grade causes puddles, scalping, and uneven establishment.',
    prerequisites: [],
    nextTasks: ['seeding', 'overseeding', 'peat-moss'],
    steps: [
      'Identify low spots and thatch/debris to remove.',
      'Spread screened topsoil or compost/soil blend.',
      'Rake smooth; firm lightly — do not leave fluffy seedbed.',
      'Seed promptly so soil does not crust unused.',
    ],
    equipment: ['Rake', 'Wheelbarrow'],
    supplies: ['Screened topsoil or compost blend'],
    calculator: { type: 'volume', rateKey: 'topsoil' },
    caveats: ['Depth is a starting template — deep fills may need layered settling.'],
  },
  {
    id: 'peat-moss',
    name: 'Peat moss topdress',
    category: 'establishment',
    summary: 'Thin organic layer after seeding to hold moisture and improve contact.',
    why: 'Helps germination consistency, especially on firmer soils.',
    prerequisites: ['overseeding', 'seeding'],
    nextTasks: ['watering'],
    steps: [
      'After seed is down, broadcast a very light peat layer.',
      'You should still see some seed — do not bury deeply.',
      'Water immediately to settle the layer.',
    ],
    equipment: ['Shovel or peat spreader'],
    supplies: ['Sphagnum peat moss'],
    calculator: { type: 'volume', rateKey: 'peatMoss' },
    caveats: ['A dusting beats a blanket. Too thick smothers seed.'],
  },
  {
    id: 'mulch',
    name: 'Bed & tree mulch',
    category: 'landscape',
    summary: 'Refresh landscape beds and tree rings — separate from lawn seeding.',
    why: 'Moisture retention and weed suppression in beds; keeps mower damage down at trunks.',
    prerequisites: [],
    nextTasks: [],
    steps: [
      'Edge beds; remove old weeds.',
      'Apply 2–3 inches of mulch.',
      'Keep mulch pulled back from trunks (no volcanoes).',
    ],
    equipment: ['Edging tool', 'Wheelbarrow'],
    supplies: ['Hardwood or pine mulch'],
    calculator: { type: 'volume', rateKey: 'mulch' },
    caveats: ['Mulch beds ≠ peat topdress on seed.'],
  },
  {
    id: 'fertilization',
    name: 'Fertilization',
    category: 'nutrition',
    summary: 'Starter with new seed; maintenance feed in cool seasons.',
    why: 'Supports establishment and density without pushing soft summer growth.',
    prerequisites: [],
    nextTasks: [],
    steps: [
      'Choose starter vs maintenance product based on job.',
      'Calibrate spreader; apply evenly.',
      'Water in per bag directions.',
      'Skip heavy nitrogen during peak summer heat.',
    ],
    equipment: ['Broadcast spreader'],
    supplies: ['Starter or maintenance fertilizer'],
    calculator: { type: 'coverage', rateKey: 'starterFert', altRateKey: 'maintFert' },
    caveats: ['Soil test when possible — these are generic starting rates.'],
  },
  {
    id: 'watering',
    name: 'Watering (establishment)',
    category: 'establishment',
    summary: 'Light, frequent moisture until seedlings root; then deepen.',
    why: 'Most seeding failures are moisture failures, not genetics.',
    prerequisites: ['seeding', 'overseeding'],
    nextTasks: [],
    steps: [
      'Keep the top ½ inch moist with light cycles (often 2–4×/day early).',
      'Taper frequency and increase depth as roots develop.',
      'Avoid puddling and runoff.',
      'After establishment, water deeply and infrequently.',
    ],
    equipment: ['Hose and sprinklers, or irrigation', 'Rain gauge (optional)'],
    supplies: [],
    calculator: null,
    caveats: ['Adjust for heat, wind, and shade — there is no single daily minute count.'],
  },
  {
    id: 'pre-em-spring',
    name: 'Spring pre-emergent',
    category: 'weeds',
    summary:
      'Crabgrass preventer before seed germinates. Soil temperature — not the calendar — is the cue.',
    why: 'Stops crabgrass and other summer annuals from starting. Cheaper than chasing clumps in July.',
    prerequisites: [],
    nextTasks: ['post-em-grassy'],
    steps: [
      'Confirm soil at 6 cm is ~50–55°F and trending up — not already in the 60s.',
      'Mow, then apply on a dry, calm day.',
      'Water in if the label says so (most granules need irrigation or rain).',
      'Stay off until dry; keep pets off per the label.',
      'Do not seed or overseed until the product’s wait interval is over.',
    ],
    equipment: ['Spreader or sprayer', 'PPE — gloves, eye protection, long sleeves'],
    supplies: ['Pre-emergent granule or liquid (prodiamine, dithiopyr, or pendimethalin type)'],
    calculator: {
      type: 'coverage',
      rateKey: 'preEmGeneric',
      rateKeys: ['preEmGeneric', 'prodiamineG', 'dithiopyrG', 'pendimethalinG'],
    },
    caveats: [
      'Most crabgrass preventers also block lawn seed. Skip this if you will seed soon.',
      'Rates are starting templates — concentration on the bag you bought wins.',
    ],
  },
  {
    id: 'pre-em-fall',
    name: 'Fall pre-emergent',
    category: 'weeds',
    summary:
      'Winter-annual / Poa preventer in late summer. Conflicts with fall overseeding.',
    why: 'Poa and henbit germinate as soils cool. A fall barrier helps if you are not seeding.',
    prerequisites: [],
    nextTasks: ['post-em-broadleaf'],
    steps: [
      'Decide this season: fall seed, or fall pre-em — not both with a typical preventer.',
      'Apply while soil is still warm enough for the product to bind (often Aug–Sep).',
      'Water in per label.',
      'Log the date so you do not seed into the residue.',
    ],
    equipment: ['Spreader or sprayer', 'PPE — gloves, eye protection, long sleeves'],
    supplies: ['Pre-emergent granule or liquid'],
    calculator: {
      type: 'coverage',
      rateKey: 'preEmGeneric',
      rateKeys: ['preEmGeneric', 'prodiamineG', 'dithiopyrG', 'pendimethalinG'],
    },
    caveats: [
      'If this app is telling you to overseed, skip fall pre-em unless the label allows seeding.',
      'Split applications and wait intervals are product-specific.',
    ],
  },
  {
    id: 'post-em-broadleaf',
    name: 'Post-emergent — broadleaf weeds',
    category: 'weeds',
    summary:
      'Spray dandelion, clover, henbit and other broadleaves while they are growing.',
    why: 'Dense turf still gets broadleaves. Spot or broadcast after they are up, not before.',
    prerequisites: [],
    nextTasks: ['post-em-grassy'],
    steps: [
      'Identify broadleaf vs grassy weeds — this pass does not replace a crabgrass killer.',
      'Spray on a calm day when weeds are actively growing and turf is not drought-stressed.',
      'Avoid rain in the label’s rainfast window; keep people and pets off until dry.',
      'Skip seedbeds and new grass until the label says it is safe.',
    ],
    equipment: ['Pump sprayer', 'PPE — gloves, eye protection, long sleeves'],
    supplies: ['Broadleaf herbicide (2,4-D / 3-way type)'],
    calculator: {
      type: 'sprayer',
      rateKey: 'broadleaf3way',
      rateKeys: ['broadleaf3way', 'twentyFourD'],
    },
    caveats: [
      'High heat + 2,4-D can yellow desirable grass. Morning applications in moderate temps are safer.',
      'Confirm the mix lists your grass species, especially on mixed or bermuda lawns.',
    ],
  },
  {
    id: 'post-em-grassy',
    name: 'Post-emergent — grassy weeds',
    category: 'weeds',
    summary:
      'Crabgrass and foxtail rescue after they have already germinated.',
    why: 'Pre-em misses happen. Young plants are much easier than mature clumps.',
    prerequisites: [],
    nextTasks: [],
    steps: [
      'Confirm it is crabgrass/foxtail, not desirable grass going off-color.',
      'Treat while plants are small; mature clumps often need repeat passes or a different plan.',
      'Use a product labeled for your grass type (quinclorac-type is common on tall fescue).',
      'Water and mowing intervals follow the label — don’t assume same-day mow is fine.',
    ],
    equipment: ['Pump sprayer', 'PPE — gloves, eye protection, long sleeves'],
    supplies: ['Grassy-weed herbicide (quinclorac-type)'],
    calculator: {
      type: 'sprayer',
      rateKey: 'quinclorac',
      rateKeys: ['quinclorac'],
    },
    caveats: [
      'A crabgrass killer safe on fescue can wreck bermuda in a mixed lawn (and the reverse).',
      'This is not a substitute for spring pre-emergent next year.',
    ],
  },
  {
    id: 'grub-preventative',
    name: 'Grub control — preventative',
    category: 'pests',
    summary:
      'Season-ahead grub product, before larvae are large enough to chew roots.',
    why: 'Preventative actives need time to work. Waiting until the lawn peels up is a different job.',
    prerequisites: [],
    nextTasks: ['grub-curative'],
    steps: [
      'Apply in the product’s window (often April–June; some actives want earlier).',
      'Water in so the material reaches the root zone.',
      'Keep a note of what you used — curative products are a different chemistry later.',
    ],
    equipment: ['Broadcast spreader', 'PPE — gloves, eye protection, long sleeves'],
    supplies: ['Preventative grub granule (imidacloprid or chlorantraniliprole type)'],
    calculator: {
      type: 'coverage',
      rateKey: 'imidaclopridG',
      rateKeys: ['imidaclopridG', 'chlorantraniliproleG'],
    },
    caveats: [
      'Preventative and curative bags are not interchangeable. Match the timing to the active.',
      'If you had no grub history, this is optional — not every lawn needs an annual insecticide.',
    ],
  },
  {
    id: 'grub-curative',
    name: 'Grub control — curative',
    category: 'pests',
    summary:
      'Treat when you already see damage: spongy turf, scattered brown, animals digging.',
    why: 'Large larvae are feeding now. A curative active (often trichlorfon-type) is the usual rescue.',
    prerequisites: [],
    nextTasks: ['grub-preventative'],
    steps: [
      'Peel back a square of turf: C-shaped grubs in the root zone confirm the diagnosis.',
      'Apply a curative product labeled for existing grubs — not last spring’s preventative leftover.',
      'Water thoroughly so it reaches the larvae.',
      'Keep people and pets off per the label; plan preventative next season if pressure was high.',
    ],
    equipment: ['Spreader or sprayer', 'PPE — gloves, eye protection, long sleeves'],
    supplies: ['Curative grub product (trichlorfon-type)'],
    calculator: {
      type: 'coverage',
      rateKey: 'trichlorfonG',
      rateKeys: ['trichlorfonG'],
    },
    caveats: [
      'If you cannot find grubs, brown patches may be drought, fungus, or animals — don’t spray blind.',
      'Some preventative products do little once larvae are large.',
    ],
  },
]

export function getTask(id: string): Task | null {
  return tasks.find((t) => t.id === id) || null
}

export function getTasksByCategory(category: string): Task[] {
  return tasks.filter((t) => t.category === category)
}
