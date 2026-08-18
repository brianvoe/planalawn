import type { Product } from '../types'

/**
 * Named products, with the numbers off their labels.
 *
 * Rules this file lives by:
 *
 * 1. Every rate and every spreader setting comes from the manufacturer — the
 *    label PDF or the maker's own product page. Nothing is interpolated, and a
 *    setting that isn't published simply isn't here; the calibration helper
 *    covers that case instead.
 * 2. Rates are stored per 1,000 sq ft, since that's the figure that scales.
 *    Per-gallon numbers are only recorded when the label prints one for spot
 *    spraying.
 * 3. Where a rate is bag weight over stated coverage, the notes say so. That's
 *    the label's own arithmetic, not a guess.
 * 4. Formulations get revised and settings change with them — Scotts moved Turf
 *    Builder from 32-0-4 to 38-0-4 with different dial numbers, and both bags
 *    are still on shelves — so entries are keyed to the analysis printed on the
 *    bag, and the UI keeps pointing back at the label in hand.
 */
export const products: Product[] = [
  // ── Broadleaf weeds, sprayed ─────────────────────────────────────────────
  {
    id: 'speedzone-lawn',
    name: 'SpeedZone Lawn Weed Killer',
    brand: 'PBI-Gordon',
    form: 'liquid',
    active: '2,4-D ester 28.57%, mecoprop-p 5.88%, dicamba 1.71%, carfentrazone 0.62%',
    purpose: 'Broadleaf weeds — clover, dandelion, chickweed, ground ivy',
    taskIds: ['post-em-broadleaf'],
    ozPer1000: 1.4,
    ozPer1000Range: [1.1, 1.5],
    waterGalPer1000: [1, 1],
    ozPerGallon: 1,
    maxPerYear: '2 broadcast applications a year; 3 fl oz per 1,000 sq ft per season.',
    reentry: 'Keep off until dry. Delay mowing a day or two either side.',
    waterIn: 'no',
    waterInNote: 'Do not water in — rain or irrigation within 4 hours can undo it.',
    turf: ['cool', 'mixed', 'warm'],
    grassNote:
      'Cool-season rate shown; common bermuda 1.5, hybrid bermuda and zoysia 1.1. Not for St. Augustine, centipede, bahia or carpetgrass. Skip broadcast work above 85°F.',
    notes:
      'The homeowner bottle, capped tighter than the professional one: 1.5 fl oz per 1,000 sq ft per application. Works in cool weather, which is why it is the usual spring and fall cleanup pick.',
    labelUrl: 'https://www.domyown.com/msds/SpeedZone-Lawn-Label.pdf',
  },
  {
    id: 'speedzone-southern',
    name: 'SpeedZone Southern',
    brand: 'PBI-Gordon',
    form: 'liquid',
    active: '2,4-D ester 10.49%, mecoprop-p 2.66%, dicamba 0.67%, carfentrazone 0.54%',
    purpose: 'Broadleaf weeds in southern turf, including St. Augustine',
    taskIds: ['post-em-broadleaf'],
    ozPer1000: 1.5,
    ozPer1000Range: [0.55, 2.2],
    waterGalPer1000: [1, 5],
    ozPerGallon: 1.5,
    maxPerYear: '2 broadcast treatments a season, 30 days apart.',
    reentry: 'Keep off until dry. Rainfast in about 3 hours.',
    waterIn: 'no',
    turf: ['warm', 'mixed'],
    grassNote:
      'Rate is per species: common bermuda 1.1–1.8, hybrid bermuda and zoysia 0.75–1.5, St. Augustine 0.55–1.5 (never Floratam or Bitterblue), cool-season 1.5–2.2.',
    notes:
      'About a third the strength of regular SpeedZone, so the two are not interchangeable at the same fl oz. Nothing broadcast above 85°F, and nothing on St. Augustine during spring green-up.',
    labelUrl: 'https://www.domyown.com/msds/SpeedZoneSouthern_label.pdf',
  },
  {
    id: 'weed-b-gon-crabgrass',
    name: 'Weed B-Gon + Crabgrass Control',
    brand: 'Ortho',
    form: 'liquid',
    active: '2,4-D 6.42%, quinclorac 2.13%, dicamba 0.60%',
    purpose: 'Broadleaf weeds and crabgrass in one pass',
    taskIds: ['post-em-broadleaf', 'post-em-grassy'],
    ozPer1000: 6.25,
    ozPer1000Range: [6.25, 6.4],
    waterGalPer1000: [2.5, 2.5],
    ozPerGallon: 2.5,
    maxPerYear: '2 applications a year, 21 days apart; 12.8 fl oz per 1,000 sq ft a season.',
    reentry: 'Rainproof in an hour; back on the lawn once dry.',
    waterIn: 'no',
    waterInNote: 'Water the day before, then leave it dry for 24 hours after.',
    turf: ['cool', 'mixed', 'warm'],
    grassNote:
      'Not for St. Augustine (including Floratam), bahia, bentgrass, carpetgrass, centipede or seashore paspalum. Bermuda only below 85°F.',
    notes:
      'The label sells it as 2.5 fl oz per gallon covering 400 sq ft, which works out to 6.25 fl oz per 1,000 sq ft — just under its own 6.4 ceiling. The big-box answer when you have both weeds and crabgrass.',
    labelUrl:
      'https://scottsmiraclegro.com/en-us/brands/ortho/products/weed-control/ortho-weed-b-gon-lawn-weed-killer-crabgrass-control/9915110.html',
  },
  {
    id: 'trimec-classic',
    name: 'Trimec Classic',
    brand: 'PBI-Gordon',
    form: 'liquid',
    active: '2,4-D 25.93%, mecoprop-p 6.93%, dicamba 2.76%',
    purpose: 'Three-way broadleaf herbicide, the workhorse concentrate',
    taskIds: ['post-em-broadleaf'],
    ozPer1000: 1.2,
    ozPer1000Range: [0.75, 1.5],
    waterGalPer1000: [1, 6],
    ozPerGallon: 1.2,
    maxPerYear: '2 applications a year, 30 days apart; about 2.9 fl oz per 1,000 sq ft a season.',
    reentry: 'Keep people and pets off until dry. No irrigation for 24 hours after.',
    waterIn: 'no',
    turf: ['cool', 'mixed', 'warm'],
    grassNote:
      'Cool-season, common bermuda, bahia and zoysia 1.2–1.5; hybrid bermuda 0.75–1.5; bentgrass, centipede and St. Augustine capped at 1 fl oz per 1,500 sq ft. Not for carpetgrass, dichondra or Floratam.',
    notes:
      'A gallon jug lasts years at these rates. Wait three to four weeks before seeding into treated ground, and skip broadcast passes above 85°F.',
    labelUrl:
      'https://earlybirdgoodfield.com/Landscape/TURF/Protection/Lawn%20Herbicides/TRIMEC%20CLASSIC%20PRODUCT%20SPECIMEN%20LABEL.pdf',
  },
  {
    id: 'celsius-wg',
    name: 'Celsius WG',
    brand: 'Envu',
    form: 'liquid',
    measure: 'oz wt',
    active: 'Dicamba 57.4%, thiencarbazone-methyl 8.7%, iodosulfuron 1.9%',
    purpose: 'Broadleaf and grassy weeds in warm-season turf, safe in summer heat',
    taskIds: ['post-em-broadleaf', 'post-em-grassy'],
    ozPer1000: 0.085,
    ozPer1000Range: [0.057, 0.113],
    waterGalPer1000: [1, 1],
    adjuvant: 'Non-ionic surfactant at 0.25% under heavy weed pressure — none above 90°F.',
    maxPerYear: '0.17 oz by weight per 1,000 sq ft in any 365 days.',
    reentry: 'Keep off until dry; do not irrigate until the spray has dried.',
    waterIn: 'no',
    turf: ['warm'],
    grassNote:
      'Warm-season only: St. Augustine, bermuda, centipede, zoysia. Explicitly prohibited on all cool-season turf and on bahia and seashore paspalum.',
    notes:
      'Dosed by weight in hundredths of an ounce — 1.6 to 3.2 grams per 1,000 sq ft — so you need a gram scale, not a measuring cup. Its selling point is that it works when it is too hot for anything with 2,4-D in it.',
    labelUrl:
      'https://bynder.envu.com/m/65d25e1e68990f59/original/Digital_TO_Celsius-WG_label_NA_US_EN.pdf',
  },

  // ── Grassy weeds, sprayed ────────────────────────────────────────────────
  {
    id: 'quinclorac-75df',
    name: 'Quinclorac 75 DF',
    brand: 'Quali-Pro',
    form: 'liquid',
    measure: 'oz wt',
    active: 'Quinclorac 75%',
    purpose: 'Crabgrass rescue once it is already up, plus clover',
    taskIds: ['post-em-grassy'],
    ozPer1000: 0.367,
    waterGalPer1000: [0.5, 1],
    adjuvant: 'Methylated seed oil at 0.55 fl oz per 1,000 sq ft — it barely works without it.',
    maxPerYear: '0.367 oz by weight per 1,000 sq ft a year on this registration.',
    waterIn: 'no',
    waterInNote: 'No water for 24 hours, then at least ½ inch two to seven days later.',
    turf: ['cool', 'mixed', 'warm'],
    grassNote:
      'Not for St. Augustine, centipede, bahia, carpetgrass or dichondra, and not fine fescue unless it is part of a blend.',
    notes:
      'A dry powder weighed in fractions of an ounce; the annual cap differs between registrations, so check the jug you own. Kills crabgrass that a pre-emergent missed, which almost nothing else does.',
    labelUrl: 'https://www3.epa.gov/pesticides/chem_search/ppls/053883-00376-20200505.pdf',
  },
  {
    id: 'tenacity',
    name: 'Tenacity',
    brand: 'Syngenta',
    form: 'liquid',
    active: 'Mesotrione 40%',
    purpose: 'Weed control you can spray at seeding time',
    taskIds: ['seeding', 'overseeding', 'post-em-grassy'],
    ozPer1000: 0.184,
    ozPer1000Range: [0.092, 0.184],
    waterGalPer1000: [1, 1],
    adjuvant: 'Non-ionic surfactant, required for post-emergent work — 1½ tsp per gallon.',
    maxPerYear: 'About 0.37 fl oz per 1,000 sq ft a year; 14 days minimum between passes.',
    reentry: 'Keep off until dry.',
    waterIn: 'either',
    waterInNote:
      'Post-emergent: let it dry on the leaf. Pre-emergent: water in 0.15 inch if no rain inside 10 days.',
    turf: ['cool', 'mixed'],
    grassNote:
      'Cool-season turf; 0.115 fl oz is the pre-emergent ceiling on perennial rye and fine fescue. St. Augustine only on sod farms. Check your species on the label.',
    notes:
      'The rare herbicide you can put down with new seed. Turns treated weeds bone white before they die, which looks alarming and is normal. Measured in fractions of an ounce — a syringe beats a cup.',
    labelUrl: 'https://www3.epa.gov/pesticides/chem_search/ppls/000100-01267-20220928.pdf',
  },

  // ── Pre-emergent ─────────────────────────────────────────────────────────
  {
    id: 'prodiamine-65wdg',
    name: 'Prodiamine 65 WDG',
    brand: 'generic (Quali-Pro, PrimeraOne and others)',
    form: 'liquid',
    measure: 'oz wt',
    active: 'Prodiamine 65%',
    purpose: 'Season-long crabgrass prevention, sprayed',
    taskIds: ['pre-em-spring', 'pre-em-fall'],
    ozPer1000: 0.37,
    ozPer1000Range: [0.185, 0.83],
    waterGalPer1000: [0.5, 1],
    maxPerYear:
      'Annual cap by species: tall fescue 0.83, bluegrass and rye 0.55, fine fescue 0.42 oz by weight per 1,000 sq ft.',
    reentry: 'Keep off until dry.',
    waterIn: 'yes',
    waterInNote: 'Needs ½ inch of rain or irrigation within 14 days or it stays on the surface.',
    turf: ['cool', 'mixed', 'warm'],
    grassNote:
      'Rates are per species and the annual cap is a hard ceiling. Not for putting greens or bentgrass mowed under half an inch.',
    notes:
      'A pound of powder covers a lawn for years, which is why enthusiasts leave granular pre-emergents behind for it. Blocks lawn seed too — do not use it in a season you plan to seed.',
    labelUrl: 'https://www.domyown.com/msds/PRODIAMINE_65WDG_Label.pdf',
  },
  {
    id: 'scotts-halts',
    name: 'Turf Builder Halts Crabgrass Preventer with Lawn Food',
    brand: 'Scotts',
    form: 'granular',
    active: '30-0-4 with pendimethalin 1.29%',
    purpose: 'Crabgrass prevention and a spring feeding in one bag',
    taskIds: ['pre-em-spring', 'fertilization'],
    lbPer1000: 2.67,
    bags: [{ lb: 13.35, coverageSqFt: 5000 }],
    settings: [
      { spreaderId: 'scotts-rotary', setting: '3' },
      { spreaderId: 'scotts-drop', setting: '6' },
    ],
    notLabeledFor: ['scotts-wizz', 'scotts-whirl'],
    waterIn: 'yes',
    waterInNote: 'Apply to a dry lawn, then water ¼–½ inch within two or three days.',
    reentry: 'Keep off until the dust has settled.',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'Rate is the bag: 13.35 lb over its stated 5,000 sq ft. Pendimethalin stains concrete orange — blow the driveway off before you water. Blocks lawn seed, so skip it if you plan to seed this spring.',
    labelUrl:
      'https://scottsmiraclegro.com/en-us/brands/scotts/products/lawn-weed-control/turf-builder-halts-crabgrass-preventer-with-lawn-food/',
  },
  {
    id: 'prodiamine-038-granular',
    name: 'Prodiamine 0.38% granular 0-0-7',
    brand: 'generic (Yard Mastery and others)',
    form: 'granular',
    active: 'Prodiamine 0.38% on a 0-0-7 carrier',
    purpose: 'Crabgrass prevention without a sprayer',
    taskIds: ['pre-em-spring', 'pre-em-fall'],
    lbPer1000: 3,
    lbPer1000Range: [2, 3],
    bags: [{ lb: 50, coverageSqFt: 16000 }],
    waterIn: 'yes',
    waterInNote: 'Needs ½ inch of water within 14 days to move into the soil.',
    turf: ['cool', 'mixed', 'warm'],
    grassNote:
      'Annual cap by species: 9 lb warm-season, 6 lb bluegrass and rye, 4.5 lb red fescue per 1,000 sq ft.',
    notes:
      'The same active as Prodiamine 65 WDG on a carrier, for people who would rather not mix. No manufacturer publishes spreader settings for it — the numbers floating around come from retailers — so calibrate this one.',
    labelUrl: 'https://www.domyown.com/prodiamine-65-wdg-c-478.html',
  },
  {
    id: 'lesco-dimension-015',
    name: 'Dimension 0.15% granular with fertilizer',
    brand: 'Lesco / SiteOne',
    form: 'granular',
    active: 'Dithiopyr 0.15%',
    purpose: 'Crabgrass prevention with a little early rescue built in',
    taskIds: ['pre-em-spring'],
    lbPer1000: 2.75,
    lbPer1000Range: [1.91, 7.65],
    settings: [
      {
        spreaderId: 'lesco-rotary',
        setting: '13',
        note: 'At the 2.75 lb rate; 14 at 3.82 lb.',
      },
    ],
    waterIn: 'yes',
    waterInNote: 'Half an inch of rain or irrigation; control gets erratic past 14 days.',
    turf: ['cool', 'mixed', 'warm'],
    grassNote:
      'Rate is regional: North 1.91–3.82, transition 2.75–5.66, South 3.82–7.65 lb per 1,000 sq ft.',
    notes:
      'Dithiopyr still catches crabgrass that has just cracked the surface, which prodiamine will not. The label prints Lesco, PermaGreen, Spyker and Vicon settings only — nothing for Scotts or Earthway.',
    labelUrl:
      'https://labelsds.com/document.php?file=Lesco+19-0-6+.15+Dimension+Label+9-30-22.pdf&product=5017',
  },

  // ── Fertilizer ───────────────────────────────────────────────────────────
  {
    id: 'scotts-turf-builder-38-0-4',
    name: 'Turf Builder Lawn Food (38-0-4)',
    brand: 'Scotts',
    form: 'granular',
    active: '38-0-4',
    purpose: 'The default feeding, four times a year',
    taskIds: ['fertilization'],
    lbPer1000: 3.16,
    lbPer1000Range: [3.16, 4.21],
    bags: [{ lb: 12.64, coverageSqFt: 4000 }],
    settings: [
      {
        spreaderId: 'scotts-rotary',
        setting: '4',
        note: '5 at the heavier Max Greening rate.',
      },
      { spreaderId: 'scotts-elite', setting: '5', note: '5½ at Max Greening.' },
      { spreaderId: 'scotts-drop', setting: '4½', note: '6 at Max Greening.' },
      { spreaderId: 'scotts-wizz', setting: '4½', note: '5 at Max Greening.' },
    ],
    waterIn: 'yes',
    maxPerYear: '4 feedings a year; no more than 2 at the Max Greening rate.',
    reentry: 'Kids and pets back on once it is watered in.',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'This is the current bag. Scotts reformulated from 32-0-4 to 38-0-4 and the dial numbers moved with it, so check the analysis on your bag before trusting a setting — the older bag is still on shelves.',
    labelUrl:
      'https://scottsmiraclegro.com/en-us/brands/scotts/products/lawn-fertilizer/turf-builder-lawn-food/',
  },
  {
    id: 'scotts-turf-builder-32-0-4',
    name: 'Turf Builder Lawn Food (32-0-4, older bag)',
    brand: 'Scotts',
    form: 'granular',
    active: '32-0-4',
    purpose: 'The default feeding, four times a year',
    taskIds: ['fertilization'],
    lbPer1000: 2.5,
    bags: [{ lb: 12.5, coverageSqFt: 5000 }],
    settings: [
      { spreaderId: 'scotts-rotary', setting: '3½' },
      { spreaderId: 'scotts-drop', setting: '6½' },
      { spreaderId: 'scotts-wizz', setting: '3¾' },
    ],
    waterIn: 'either',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'The previous formulation, kept here because it is still in garages and on shelves. Rate is 12.5 lb over its stated 5,000 sq ft. If your bag says 38-0-4, use the other entry — the settings differ.',
    labelUrl:
      'https://lawnchick.com/wp-content/uploads/2024/02/scotts-turf-builder-lawn-food-32-0-4-bag-label.pdf',
  },
  {
    id: 'milorganite',
    name: 'Milorganite 6-4-0',
    brand: 'Milorganite',
    form: 'granular',
    active: '6-4-0 with 2.5% iron, slow-release organic nitrogen',
    purpose: 'Slow, safe nitrogen and colour with no burn risk',
    taskIds: ['fertilization'],
    lbPer1000: 12.8,
    bags: [{ lb: 32, coverageSqFt: 2500 }],
    settings: [
      {
        spreaderId: 'scotts-rotary',
        setting: '11.5',
        note: 'Milorganite asks for two passes at this setting for even coverage.',
      },
      {
        spreaderId: 'scotts-drop',
        setting: '10',
        note: 'AccuGreen series; 16 for a new lawn.',
      },
      {
        spreaderId: 'earthway',
        setting: '19',
        note: 'EV-N-Spred models; two passes.',
      },
      { spreaderId: 'republic-ez', setting: '14', note: 'Two passes.' },
    ],
    waterIn: 'either',
    maxPerYear: '4 applications a year.',
    reentry: 'No restriction — it is a fertilizer, not a pesticide.',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'A heavy 12.8 lb per 1,000 sq ft because it is only 6% nitrogen — that is the 32 lb bag over its stated 2,500 sq ft. Nearly impossible to burn a lawn with, which is why it is the summer default in the transition zone.',
    labelUrl: 'https://www.milorganite.com/lawn-care/spreader-settings',
  },
  {
    id: 'andersons-pgf-complete',
    name: 'PGF Complete 16-4-8',
    brand: 'The Andersons',
    form: 'granular',
    active: '16-4-8 with humic DG, 2% iron',
    purpose: 'Fine-particle feeding that disperses instead of sitting on top',
    taskIds: ['fertilization'],
    lbPer1000: 3.6,
    bags: [
      { lb: 18, coverageSqFt: 5000 },
      { lb: 40, coverageSqFt: 11100 },
    ],
    settings: [
      { spreaderId: 'scotts-rotary', setting: '4½' },
      { spreaderId: 'scotts-elite', setting: '4½' },
      { spreaderId: 'scotts-drop', setting: '6½' },
      { spreaderId: 'scotts-wizz', setting: '5' },
      { spreaderId: 'earthway', setting: '13' },
      { spreaderId: 'agri-fab', setting: '4' },
    ],
    waterIn: 'yes',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'The granules are much smaller than a big-box bag, so settings from other products do not carry over — this label publishes its own, including Earthway and Agri-Fab. Mows off cleanly the same day.',
    labelUrl:
      'https://d2eh2cb2k6p9dt.cloudfront.net/documents/Spreader-Settings/PFG-Complete-16-4-8_Spreader-Settings.pdf',
  },
  {
    id: 'scotts-starter',
    name: 'Turf Builder Starter Food for New Grass',
    brand: 'Scotts',
    form: 'granular',
    active: '24-25-4',
    purpose: 'Phosphorus for seed and sod at establishment',
    taskIds: ['seeding', 'overseeding'],
    lbPer1000: 3,
    bags: [
      { lb: 3, coverageSqFt: 1000 },
      { lb: 15, coverageSqFt: 5000 },
    ],
    settings: [
      { spreaderId: 'scotts-rotary', setting: '3¼' },
      { spreaderId: 'scotts-drop', setting: '6' },
    ],
    waterIn: 'yes',
    waterInNote: 'Keep the soil moist daily until seedlings are about 2 inches tall.',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'Safe to put down the same day as seed. Rate is 15 lb over its stated 5,000 sq ft. No weed control in this one, which is what makes it seed-safe.',
    labelUrl:
      'https://scottsmiraclegro.com/en-us/brands/scotts/products/lawn-fertilizer/turf-builder-starter-food-for-new-grass/',
  },
  {
    id: 'scotts-starter-plus-weed-preventer',
    name: 'Turf Builder Starter Food Plus Weed Preventer',
    brand: 'Scotts',
    form: 'granular',
    active: '21-22-4 with mesotrione 0.08%',
    purpose: 'Starter fertilizer that also stops weeds in a new seeding',
    taskIds: ['seeding', 'overseeding'],
    lbPer1000: 4.3,
    bags: [{ lb: 21.52, coverageSqFt: 5000 }],
    settings: [
      { spreaderId: 'scotts-rotary', setting: '4½' },
      { spreaderId: 'scotts-drop', setting: '7' },
    ],
    waterIn: 'yes',
    turf: ['cool', 'mixed', 'warm'],
    grassNote: 'Not sold in Florida.',
    notes:
      'Mesotrione is the same active as Tenacity, which is why this can prevent weeds without hurting new grass — the one weed preventer that belongs in a seedbed. The 4.3 lb rate is printed on the bag.',
    labelUrl:
      'https://scottsmiraclegro.com/en-us/brands/scotts/products/lawn-fertilizer/turf-builder-starter-food-for-new-grass-plus-weed-preventer/',
  },
  {
    id: 'scotts-weed-and-feed',
    name: 'Turf Builder Weed & Feed',
    brand: 'Scotts',
    form: 'granular',
    active: '26-0-2 with broadleaf herbicide',
    purpose: 'Feeding plus broadleaf weed control in one pass',
    taskIds: ['fertilization', 'post-em-broadleaf'],
    lbPer1000: 2.83,
    bags: [{ lb: 11.32, coverageSqFt: 4000 }],
    settings: [
      { spreaderId: 'scotts-rotary', setting: '3¾' },
      { spreaderId: 'scotts-elite', setting: '4¼' },
      { spreaderId: 'scotts-drop', setting: '7¼' },
      { spreaderId: 'scotts-wizz', setting: '4¼' },
    ],
    waterIn: 'no',
    waterInNote: 'Apply to damp or dewy grass and keep water off for 24 hours — it needs to stick.',
    turf: ['cool', 'mixed'],
    notes:
      'The granules have to cling to wet leaves to work, which is the opposite of every other bag here. A sprayed herbicide beats it on weeds; this wins on convenience.',
    labelUrl:
      'https://scottsmiraclegro.com/en-us/brands/scotts/products/lawn-weed-control/turf-builder-weed-feed/',
  },
  {
    id: 'scotts-bonus-s',
    name: 'Turf Builder Bonus S Southern Weed & Feed',
    brand: 'Scotts',
    form: 'granular',
    active: '29-0-10 with atrazine',
    purpose: 'Southern feeding plus weed control, St. Augustine safe',
    taskIds: ['fertilization', 'post-em-broadleaf'],
    lbPer1000: 3.45,
    bags: [
      { lb: 17.24, coverageSqFt: 5000 },
      { lb: 34.48, coverageSqFt: 10000 },
    ],
    settings: [
      {
        spreaderId: 'scotts-rotary',
        setting: '4¼',
        note: '5¼ on the 10,000 sq ft bag — check which one you bought.',
      },
      {
        spreaderId: 'scotts-drop',
        setting: '7¼',
        note: '11 on the 10,000 sq ft bag.',
      },
    ],
    notLabeledFor: ['scotts-wizz', 'scotts-whirl'],
    waterIn: 'yes',
    waterInNote: 'Water in immediately — this one is not optional.',
    turf: ['warm'],
    grassNote: 'Southern turf including St. Augustine. Never during dormancy or spring green-up.',
    notes:
      'One of the few weed-and-feeds safe over St. Augustine. The label forbids hand-held spreaders outright, and the dial number changes with bag size.',
    labelUrl:
      'https://scottsmiraclegro.com/en-us/brands/scotts/products/lawn-weed-control/turf-builder-bonus-s-southern-weed-feed/',
  },

  // ── Insects and disease ──────────────────────────────────────────────────
  {
    id: 'scotts-grubex1',
    name: 'GrubEx1 Season Long Grub Killer',
    brand: 'Scotts',
    form: 'granular',
    active: 'Chlorantraniliprole 0.08%',
    purpose: 'Preventative grub control for the season',
    taskIds: ['grub-preventative'],
    lbPer1000: 2.87,
    bags: [
      { lb: 14.35, coverageSqFt: 5000 },
      { lb: 28.7, coverageSqFt: 10000 },
    ],
    settings: [
      { spreaderId: 'scotts-rotary', setting: '3¾' },
      { spreaderId: 'scotts-drop', setting: '7¼' },
      { spreaderId: 'scotts-wizz', setting: '4¼' },
    ],
    waterIn: 'yes',
    waterInNote: 'About 20 minutes of water to move it down to where grubs feed.',
    reentry: 'People and pets back on once it is watered in and dry.',
    maxPerYear: 'One application a year.',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'Preventative, not a rescue: down before grubs are big, in spring or early summer. Older bags print 3½ instead of 3¾ — Scotts reformulated, so read your own bag.',
    labelUrl:
      'https://scottsmiraclegro.com/en-us/brands/scotts/products/lawn-disease-insects-pests/grubex-1/99610.html',
  },
  {
    id: 'sevin-lawn-granules',
    name: 'Sevin Insect Killer Lawn Granules',
    brand: 'GardenTech',
    form: 'granular',
    active: 'Zeta-cypermethrin 0.029%',
    purpose: 'Curative surface insects — ants, ticks, chinch bugs, armyworms',
    taskIds: ['grub-curative'],
    lbPer1000: 2,
    lbPer1000Range: [1, 4],
    bags: [
      { lb: 10, coverageSqFt: 5000 },
      { lb: 20, coverageSqFt: 10000 },
    ],
    settings: [
      {
        spreaderId: 'scotts-rotary',
        setting: '7 (DLX) · 5½ (Mini)',
        note: 'At the 2 lb rate. GardenTech is unusual in publishing different numbers for DLX and Mini.',
      },
    ],
    waterIn: 'yes',
    waterInNote: 'Water immediately after applying.',
    reentry: 'Off the lawn until the dust settles, watering is done and the area has dried.',
    maxPerYear: 'No more than once every 7 days.',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'Rate is per pest: 1–2 lb for aphids, armyworms and chinch bugs, 2–4 lb for ants, ticks and grubs. A contact killer with a short residual — for a problem happening now, not prevention.',
    labelUrl:
      'https://picol.cahnrs.wsu.edu/DownloadLabel/67240/WA/WA-2025-GARDENTECH%20SEVIN%20INSECT%20KILLER%20LAWN%20GRANULES.pdf',
  },
  {
    id: 'scotts-diseaseex',
    name: 'DiseaseEx Lawn Fungicide',
    brand: 'Scotts',
    form: 'granular',
    active: 'Azoxystrobin 0.31%',
    purpose: 'Brown patch, dollar spot and summer disease',
    // No disease task in the calendar yet, so this waits to be searched for
    // rather than claiming a window it can't have.
    taskIds: [],
    lbPer1000: 2,
    lbPer1000Range: [2, 4],
    bags: [{ lb: 10, coverageSqFt: 5000 }],
    settings: [
      {
        spreaderId: 'scotts-rotary',
        setting: '2¼',
        note: '3¾ at the curative rate, when disease is already showing.',
      },
      { spreaderId: 'scotts-drop', setting: '4', note: '5½ curative.' },
      { spreaderId: 'scotts-wizz', setting: '3¼', note: '4 curative.' },
    ],
    waterIn: 'either',
    maxPerYear: '37 lb per 1,000 sq ft a year; every 14 to 28 days while pressure lasts.',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'Two rates on one bag: 2 lb preventative, 4 lb once brown patch is visible. Tall fescue in the transition zone is its main customer, in the weeks when nights stay warm and humid.',
    labelUrl:
      'https://scottsmiraclegro.com/en-us/brands/scotts/products/lawn-disease-insects-pests/diseaseex-lawn-fungicide/',
  },
  {
    id: 'bifen-it',
    name: 'Bifen I/T',
    brand: 'Control Solutions',
    form: 'liquid',
    active: 'Bifenthrin 7.9%',
    purpose: 'Sprayed insect control — mosquitoes, ticks, chinch bugs, armyworms',
    taskIds: ['grub-curative'],
    ozPer1000: 0.5,
    ozPer1000Range: [0.18, 1],
    waterGalPer1000: [1, 2],
    ozPerGallon: 0.5,
    maxPerYear: '1 fl oz per 1,000 sq ft per application; the top rate no more than every 4 weeks.',
    reentry: 'Off treated surfaces until dry — about 4 hours before rain is safe.',
    waterIn: 'no',
    waterInNote: 'Under 2 gal of water per 1,000 sq ft, follow with ¼ inch for soil pests.',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'Rate is per pest: 0.18–0.25 fl oz for sod webworm and armyworm, 0.5–1 fl oz for chinch bugs, fire ants and ticks. A cheap jug that covers most of what bites people or chews grass.',
    labelUrl: 'https://docs.diypestcontrol.com/SPEC/LABLES-2/Bifen_IT_Label.pdf',
  },
  {
    id: 'propiconazole-143',
    name: 'Propiconazole 14.3',
    brand: 'Quali-Pro',
    form: 'liquid',
    active: 'Propiconazole 14.3%',
    purpose: 'Sprayed fungicide for brown patch, dollar spot and summer patch',
    taskIds: [],
    ozPer1000: 2,
    ozPer1000Range: [1, 4],
    maxPerYear: '16 fl oz per 1,000 sq ft a calendar year; 14 to 28 days between passes.',
    reentry: 'Keep off until dry.',
    waterIn: 'no',
    waterInNote: 'Leaf diseases: let it dry, do not water in. Soil diseases: water in.',
    turf: ['cool', 'mixed', 'warm'],
    notes:
      'The cheap systemic behind most brown-patch programs: 1–2 fl oz preventative, 2 fl oz curative, up to 4 for summer patch. Rotate actives if you spray more than twice a season.',
    labelUrl:
      'https://labelsds.com/images/user_uploads/Quali-Pro%20Propiconazole%2014.3%20Label%204-19-19.pdf',
  },

  // ── Renovation ───────────────────────────────────────────────────────────
  {
    id: 'glyphosate-41',
    name: 'Concentrate Weed & Grass Killer 41% glyphosate',
    brand: 'Compare-N-Save and equivalents',
    form: 'liquid',
    active: 'Glyphosate 41%',
    purpose: 'Killing everything before a full reset',
    taskIds: ['lawn-kill'],
    ozPer1000: 8.3,
    ozPer1000Range: [5, 8.3],
    waterGalPer1000: [3.3, 3.3],
    ozPerGallon: 2.5,
    waterIn: 'no',
    turf: ['cool', 'mixed', 'warm'],
    grassNote: 'Non-selective — it kills the lawn along with the weeds. Spot or renovation only.',
    notes:
      'The label sells it by mix: 1.5 fl oz per gallon for annual weeds, 2.5 for perennials and lawn renovation, a gallon of spray per 300 sq ft. Check the percentage on your jug — "Roundup Concentrate Plus" is 18% with diquat, not 41%, and mixes differently.',
    labelUrl: 'https://www.raganandmassey.com/pub/media/files/labels/CNS_84009-27_320oz_web.pdf',
  },
]

export const productById: Record<string, Product> = Object.fromEntries(
  products.map((p) => [p.id, p]),
)

export function productsForTask(taskId: string): Product[] {
  return products.filter((p) => p.taskIds.includes(taskId))
}
